import { storage, db, auth } from "./firebase.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

import {
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


let currentUser = null;


/* AUTH */

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = user;

});


/* ELEMENTS */

const message =
    document.getElementById("message");

const submitListingBtn =
    document.getElementById("submitListingBtn");

const backBtn =
    document.getElementById("backBtn");

const themeBtn =
    document.getElementById("themeBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const isFree =
    document.getElementById("isFree");

const price =
    document.getElementById("price");


/* DARK MODE */

const savedTheme =
    localStorage.getItem("bookSahayakTheme");

if (savedTheme === "dark") {

    document.body.classList.add("dark-mode");

    if (themeBtn) {
        themeBtn.textContent = "☀️ Light";
    }

}


if (themeBtn) {

    themeBtn.addEventListener("click", () => {

        document.body.classList.toggle("dark-mode");

        const isDark =
            document.body.classList.contains("dark-mode");

        localStorage.setItem(
            "bookSahayakTheme",
            isDark ? "dark" : "light"
        );

        themeBtn.textContent =
            isDark ? "☀️ Light" : "🌙 Dark";

    });

}


/* LOGOUT */

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            await signOut(auth);

            window.location.href = "index.html";

        } catch (error) {

            console.log(error);

        }

    });

}


/* FREE CHECKBOX */

if (isFree) {

    isFree.addEventListener("change", () => {

        if (isFree.checked) {

            price.value = "";
            price.disabled = true;

        } else {

            price.disabled = false;

        }

    });

}


/* PUBLISH LISTING */

if (submitListingBtn) {

    submitListingBtn.addEventListener("click", async () => {

        if (!currentUser) {

            message.textContent =
                "Please wait for login to finish.";

            return;

        }


        const title =
            document.getElementById("title").value.trim();

        const category =
            document.getElementById("category").value;

        const subject =
            document.getElementById("subject").value.trim();

        const contactNumber =
            document.getElementById("contactNumber").value.trim();

        const description =
            document.getElementById("description").value.trim();

        const condition =
            document.getElementById("condition").value;

        const fileInput =
            document.getElementById("file");

        const file =
            fileInput.files[0];


        /* VALIDATION */

        if (!title) {

            message.textContent =
                "Please enter a title.";

            return;

        }


        if (!category) {

            message.textContent =
                "Please select a category.";

            return;

        }


        if (!subject) {

            message.textContent =
                "Please enter the subject.";

            return;

        }


        if (!contactNumber) {

            message.textContent =
                "Please enter your contact number.";

            return;

        }


        if (!/^[0-9]{10}$/.test(contactNumber)) {

            message.textContent =
                "Please enter a valid 10-digit contact number.";

            return;

        }


        if (!description) {

            message.textContent =
                "Please enter a description.";

            return;

        }


        if (!condition) {

            message.textContent =
                "Please select the condition.";

            return;

        }


        if (!isFree.checked && !price.value) {

            message.textContent =
                "Please enter a price or select Free.";

            return;

        }


        try {

            message.textContent =
                "Publishing listing...";

            submitListingBtn.disabled = true;


            let fileURL = "";
            let storagePath = "";
            let fileName = "";


            /* FILE UPLOAD */

            if (file) {

                const safeFileName =
                    file.name.replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );


                const fileRef =
                    ref(
                        storage,
                        "materials/" +
                        currentUser.uid +
                        "/" +
                        Date.now() +
                        "_" +
                        safeFileName
                    );


                await uploadBytes(
                    fileRef,
                    file,
                    {
                        contentType:
                            file.type ||
                            "application/octet-stream"
                    }
                );


                fileURL =
                    await getDownloadURL(fileRef);

                storagePath =
                    fileRef.fullPath;

                fileName =
                    file.name;

            }


            /* SAVE LISTING TO FIRESTORE */

            await addDoc(
                collection(db, "materials"),
                {
                    title: title,

                    category: category,

                    subject: subject,

                    description: description,

                    price: isFree.checked
                        ? 0
                        : Number(price.value),

                    isFree: isFree.checked,

                    condition: condition,

                    contactNumber: contactNumber,

                    fileName: fileName,

                    storagePath: storagePath,

                    fileURL: fileURL,

                    uploadedBy: currentUser.uid,

                    uploaderName:
                        currentUser.displayName ||
                        "Student",

                    uploaderEmail:
                        currentUser.email ||
                        "",

                    createdAt:
                        serverTimestamp()
                }
            );


            message.textContent =
                "Listing published successfully!";


            setTimeout(() => {

                window.location.href =
                    "home.html";

            }, 1200);


        } catch (error) {

            console.log("Publish error:", error);

            message.textContent =
                "Publish failed: " +
                error.message;

            submitListingBtn.disabled = false;

        }

    });

}


/* BACK BUTTON */

if (backBtn) {

    backBtn.addEventListener("click", () => {

        window.location.href =
            "home.html";

    });

}