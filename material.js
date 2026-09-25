import { db, auth, ADMIN_UID } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


/* =========================
   GET MATERIAL ID
========================= */

const params =
    new URLSearchParams(
        window.location.search
    );

const materialId =
    params.get("id");


/* =========================
   GET HTML ELEMENTS
========================= */

const title =
    document.getElementById(
        "materialTitle"
    );

const subject =
    document.getElementById(
        "materialSubject"
    );

const description =
    document.getElementById(
        "materialDescription"
    );

const materialPrice =
    document.getElementById(
        "materialPrice"
    );

const uploader =
    document.getElementById(
        "materialUploader"
    );

const viewFileBtn =
    document.getElementById(
        "viewFileBtn"
    );

const backBtn =
    document.getElementById(
        "backBtn"
    );

const messageSellerBtn =
    document.getElementById(
        "messageSellerBtn"
    );


/* =========================
   CURRENT USER
========================= */

let currentUser = null;


/* =========================
   LOAD MATERIAL
========================= */

async function loadMaterial() {

    if (!materialId) {

        title.textContent =
            "Material not found.";

        return;
    }


    try {

        console.log(
            "Loading material:",
            materialId
        );


        /* =========================
           GET MATERIAL
        ========================= */

        const materialRef =
            doc(
                db,
                "materials",
                materialId
            );


        const materialDoc =
            await getDoc(
                materialRef
            );


        if (!materialDoc.exists()) {

            title.textContent =
                "Material not found.";

            return;
        }


        const material =
            materialDoc.data();

        const isOwner =
            currentUser &&
            material.uploadedBy ===
            currentUser.uid;

        const isAdmin =
            currentUser &&
            currentUser.uid === ADMIN_UID;

        if (
            (material.status === "pending" ||
                material.status === "rejected") &&
            !isOwner &&
            !isAdmin
        ) {

            title.textContent =
                "Material not available.";

            return;

        }


        console.log(
            "Material loaded:",
            material
        );


        /* =========================
           TITLE
        ========================= */

        if (title) {

            title.textContent =
                material.title ||
                "Untitled Material";

        }


        /* =========================
           SUBJECT
        ========================= */

        if (subject) {

            subject.textContent =
                material.subject ||
                "Not specified";

        }


        /* =========================
           DESCRIPTION
        ========================= */

        if (description) {

            description.textContent =
                material.description ||
                "No description available.";

        }


        /* =========================
           PRICE / AVAILABILITY
        ========================= */

        if (materialPrice) {

            if (material.isFree) {

                materialPrice.textContent =
                    "FREE";

                materialPrice.classList.add(
                    "material-free"
                );

                materialPrice.classList.remove(
                    "material-paid"
                );

            }

            else if (
                material.price !== undefined &&
                material.price !== null &&
                material.price !== ""
            ) {

                materialPrice.textContent =
                    "₹" +
                    material.price;

                materialPrice.classList.add(
                    "material-paid"
                );

                materialPrice.classList.remove(
                    "material-free"
                );

            }

            else {

                materialPrice.textContent =
                    "Price not specified";

                materialPrice.classList.remove(
                    "material-free"
                );

                materialPrice.classList.remove(
                    "material-paid"
                );

            }

        }


        /* =========================
           UPLOADER
        ========================= */

        if (uploader) {

            uploader.innerHTML = "";


            const sellerName =
                document.createElement(
                    "div"
                );


            sellerName.className =
                "seller-name";


            sellerName.textContent =
                "👤 " +
                (
                    material.uploaderName ||
                    "Student"
                );


            uploader.appendChild(
                sellerName
            );

        }


        /* =========================
           MESSAGE SELLER
        ========================= */

        if (messageSellerBtn) {

            /*
             * uploadedBy is the Firebase UID
             * of the person who uploaded
             * this material.
             */

            const sellerId =
                material.uploadedBy;


            /*
             * If seller ID doesn't exist,
             * hide the button.
             */

            if (!sellerId) {

                messageSellerBtn.style.display =
                    "none";

            }

            /*
             * Don't allow the seller
             * to message themselves.
             */

            else if (
                currentUser &&
                currentUser.uid === sellerId
            ) {

                messageSellerBtn.style.display =
                    "none";

            }

            else {

                messageSellerBtn.style.display =
                    "inline-flex";


                messageSellerBtn.onclick =
                    function () {

                        window.location.href =
                            "chat.html?user=" +
                            encodeURIComponent(
                                sellerId
                            ) +
                            "&material=" +
                            encodeURIComponent(
                                materialId
                            );

                    };

            }

        }


        /* =========================
           FILE
        ========================= */

        if (viewFileBtn) {

            if (material.fileURL) {

                viewFileBtn.href =
                    material.fileURL;

                viewFileBtn.textContent =
                    "View / Download";

                viewFileBtn.style.display =
                    "inline-flex";

            }

            else {

                viewFileBtn.style.display =
                    "none";

            }

        }


    }

    catch (error) {

        console.error(
            "Error loading material:",
            error
        );


        if (title) {

            title.textContent =
                "Could not load material.";

        }


        if (subject) {

            subject.textContent =
                "";

        }


        if (description) {

            description.textContent =
                "";

        }


        if (uploader) {

            uploader.textContent =
                "";

        }


        if (messageSellerBtn) {

            messageSellerBtn.style.display =
                "none";

        }

    }

}


/* =========================
   BACK BUTTON
========================= */

if (backBtn) {

    backBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "home.html";

        }
    );

}


/* =========================
   CHECK LOGIN
========================= */

onAuthStateChanged(
    auth,
    function (user) {

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }


        currentUser =
            user;


        loadMaterial();

    }
);
