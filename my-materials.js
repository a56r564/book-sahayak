import { auth, db, storage } from "./firebase.js";

import {
    ref,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/* =========================
   HTML ELEMENTS
========================= */

const myMaterialsList =
    document.getElementById("myMaterialsList");

const backBtn =
    document.getElementById("backBtn");

const myMaterialsCount =
    document.getElementById("myMaterialsCount");

const myMaterialsThemeBtn =
    document.getElementById(
        "myMaterialsThemeBtn"
    );


/* =========================
   DARK MODE
========================= */

function applyMyMaterialsTheme() {

    const savedTheme =
        localStorage.getItem(
            "bookSahayakTheme"
        );

    const isDark =
        savedTheme === "dark";

    document.body.classList.toggle(
        "dark-mode",
        isDark
    );

    if (myMaterialsThemeBtn) {

        myMaterialsThemeBtn.textContent =
            isDark
                ? "☀️"
                : "🌙";

    }

}


applyMyMaterialsTheme();


if (myMaterialsThemeBtn) {

    myMaterialsThemeBtn.addEventListener(
        "click",
        function () {

            const isDark =
                !document.body.classList.contains(
                    "dark-mode"
                );

            document.body.classList.toggle(
                "dark-mode",
                isDark
            );

            localStorage.setItem(
                "bookSahayakTheme",
                isDark
                    ? "dark"
                    : "light"
            );

            myMaterialsThemeBtn.textContent =
                isDark
                    ? "☀️"
                    : "🌙";

        }
    );

}


/* =========================
   SHOW EMPTY STATE
========================= */

function showEmptyState() {

    myMaterialsList.innerHTML = `

        <div class="my-materials-empty">

            <div class="my-materials-empty-icon">
                📚
            </div>

            <h3>
                No materials yet
            </h3>

            <p>
                You haven't uploaded any study
                materials yet.
            </p>

            <button
                type="button"
                onclick="window.location.href='upload.html'"
            >
                Upload Material
            </button>

        </div>

    `;

}


/* =========================
   LOAD MY MATERIALS
========================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }


        try {

            /* =========================
               GET USER MATERIALS
            ========================= */

            const materialsQuery =
                query(
                    collection(
                        db,
                        "materials"
                    ),
                    where(
                        "uploadedBy",
                        "==",
                        user.uid
                    )
                );


            const querySnapshot =
                await getDocs(
                    materialsQuery
                );


            myMaterialsList.innerHTML =
                "";


            /* =========================
               NO MATERIALS
            ========================= */

            if (querySnapshot.empty) {

                myMaterialsCount.textContent =
                    "0 materials";

                showEmptyState();

                return;

            }


            /* =========================
               MATERIAL COUNT
            ========================= */

            myMaterialsCount.textContent =
                querySnapshot.size +
                (
                    querySnapshot.size === 1
                        ? " material"
                        : " materials"
                );


            /* =========================
               CREATE MATERIAL CARDS
            ========================= */

            querySnapshot.forEach(
                (docSnapshot) => {

                    const material =
                        docSnapshot.data();

                    const materialId =
                        docSnapshot.id;

                    const reviewStatus =
                        material.status ||
                        "approved";


                    const materialDiv =
                        document.createElement(
                            "div"
                        );


                    materialDiv.className =
                        "my-material-card";


                    /* =========================
                       CARD HTML
                    ========================= */

                    materialDiv.innerHTML = `

                        <div class="my-material-card-top">

                            <div class="my-material-icon">
                                📖
                            </div>

                            <span class="my-material-badge">
                                YOUR UPLOAD
                            </span>

                            <span class="my-material-status status-${escapeHTML(reviewStatus)}">
                                ${escapeHTML(
                                    reviewStatus === "pending"
                                        ? "PENDING REVIEW"
                                        : reviewStatus.toUpperCase()
                                )}
                            </span>

                        </div>


                        <h3>
                            ${escapeHTML(
                                material.title ||
                                "Untitled Material"
                            )}
                        </h3>


                        <p class="my-material-subject">
                            Subject:
                            ${escapeHTML(
                                material.subject ||
                                "Not specified"
                            )}
                        </p>


                        <p class="my-material-description">
                            ${escapeHTML(
                                material.description ||
                                "No description provided."
                            )}
                        </p>

                        ${
                            reviewStatus === "pending"
                                ? `
                                    <p class="my-material-review-note pending-note">
                                        This listing is waiting for admin review.
                                    </p>
                                `
                                : reviewStatus === "rejected"
                                    ? `
                                        <p class="my-material-review-note rejected-note">
                                            This listing was rejected and is not visible to other students.
                                        </p>
                                    `
                                    : ""
                        }


                        <div class="my-material-actions">

                            <button
                                type="button"
                                class="viewMaterialBtn"
                            >
                                View Material
                            </button>


                            <button
                                type="button"
                                class="messageMaterialBtn"
                            >
                                💬 Messages
                            </button>


                            <button
                                type="button"
                                class="deleteMaterialBtn"
                            >
                                Delete
                            </button>

                        </div>

                    `;


                    /* =========================
                       VIEW MATERIAL
                    ========================= */

                    const viewButton =
                        materialDiv.querySelector(
                            ".viewMaterialBtn"
                        );


                    viewButton.addEventListener(
                        "click",
                        () => {

                            window.location.href =
                                "material.html?id=" +
                                encodeURIComponent(
                                    materialId
                                );

                        }
                    );


                    /* =========================
                       MESSAGE BUTTON
                    ========================= */

                    const messageButton =
                        materialDiv.querySelector(
                            ".messageMaterialBtn"
                        );


                    messageButton.addEventListener(
                        "click",
                        async () => {

                            try {

                                messageButton.disabled =
                                    true;

                                messageButton.textContent =
                                    "Loading...";


                                /* =========================
                                   FIND CHAT FOR THIS MATERIAL
                                ========================= */

                                const chatsQuery =
                                    query(
                                        collection(
                                            db,
                                            "chats"
                                        ),
                                        where(
                                            "sellerId",
                                            "==",
                                            user.uid
                                        ),
                                        where(
                                            "materialId",
                                            "==",
                                            materialId
                                        )
                                    );


                                const chatsSnapshot =
                                    await getDocs(
                                        chatsQuery
                                    );


                                /* =========================
                                   NO BUYER HAS MESSAGED YET
                                ========================= */

                                if (
                                    chatsSnapshot.empty
                                ) {

                                    alert(
                                        "No messages for this material yet."
                                    );

                                    messageButton.disabled =
                                        false;

                                    messageButton.textContent =
                                        "💬 Messages";

                                    return;

                                }


                                /* =========================
                                   OPEN FIRST CONVERSATION
                                ========================= */

                                const chatDoc =
                                    chatsSnapshot.docs[0];

                                const chat =
                                    chatDoc.data();


                                const buyerId =
                                    chat.buyerId;


                                if (!buyerId) {

                                    alert(
                                        "Unable to find the buyer."
                                    );

                                    messageButton.disabled =
                                        false;

                                    messageButton.textContent =
                                        "💬 Messages";

                                    return;

                                }


                                window.location.href =
                                    "chat.html?user=" +
                                    encodeURIComponent(
                                        buyerId
                                    ) +
                                    "&material=" +
                                    encodeURIComponent(
                                        materialId
                                    );


                            } catch (error) {

                                console.error(
                                    "Error opening messages:",
                                    error
                                );


                                alert(
                                    "Could not load messages: " +
                                    error.message
                                );


                                messageButton.disabled =
                                    false;

                                messageButton.textContent =
                                    "💬 Messages";

                            }

                        }
                    );


                    /* =========================
                       DELETE MATERIAL
                    ========================= */

                    const deleteButton =
                        materialDiv.querySelector(
                            ".deleteMaterialBtn"
                        );


                    deleteButton.addEventListener(
                        "click",
                        async () => {

                            const confirmDelete =
                                confirm(
                                    "Are you sure you want to delete this material?"
                                );


                            if (!confirmDelete) {

                                return;

                            }


                            try {

                                /* =========================
                                   DELETE STORAGE FILE
                                ========================= */

                                if (
                                    material.storagePath &&
                                    material.storagePath.trim() !== ""
                                ) {

                                    const fileRef =
                                        ref(
                                            storage,
                                            material.storagePath
                                        );


                                    try {

                                        await deleteObject(
                                            fileRef
                                        );

                                    } catch (
                                        storageError
                                    ) {

                                        /*
                                         * If the file is
                                         * already missing,
                                         * continue deleting
                                         * the Firestore document.
                                         */

                                        if (
                                            storageError.code !==
                                            "storage/object-not-found"
                                        ) {

                                            throw storageError;

                                        }

                                    }

                                }


                                /* =========================
                                   DELETE FIRESTORE DOCUMENT
                                ========================= */

                                await deleteDoc(
                                    doc(
                                        db,
                                        "materials",
                                        materialId
                                    )
                                );


                                /* =========================
                                   REMOVE CARD
                                ========================= */

                                materialDiv.remove();


                                /* =========================
                                   UPDATE COUNT
                                ========================= */

                                const remaining =
                                    myMaterialsList.querySelectorAll(
                                        ".my-material-card"
                                    ).length;


                                myMaterialsCount.textContent =
                                    remaining +
                                    (
                                        remaining === 1
                                            ? " material"
                                            : " materials"
                                    );


                                /* =========================
                                   SHOW EMPTY STATE
                                ========================= */

                                if (
                                    remaining === 0
                                ) {

                                    showEmptyState();

                                }

                            } catch (error) {

                                console.error(
                                    "Delete error:",
                                    error
                                );


                                alert(
                                    "Could not delete material: " +
                                    error.message
                                );

                            }

                        }
                    );


                    /* =========================
                       ADD CARD
                    ========================= */

                    myMaterialsList.appendChild(
                        materialDiv
                    );

                }
            );


        } catch (error) {

            console.error(
                "Error loading materials:",
                error
            );


            myMaterialsCount.textContent =
                "Unable to load";


            myMaterialsList.innerHTML = `

                <div class="my-materials-empty">

                    <div class="my-materials-empty-icon">
                        ⚠️
                    </div>

                    <h3>
                        Could not load materials
                    </h3>

                    <p>
                        Please refresh the page and try again.
                    </p>

                </div>

            `;

        }

    }
);


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value);

    return div.innerHTML;

}


/* =========================
   BACK TO HOME
========================= */

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "home.html";

        }
    );

}
