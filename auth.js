import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


/* LOGIN */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const errorMessage =
            document.getElementById("errorMessage");

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            window.location.href = "home.html";

        } catch (error) {

            console.log(error);

            errorMessage.textContent =
                "Login failed: " + error.message;

        }

    });

}
/* GOOGLE LOGIN */

const googleLogin =
    document.getElementById("googleLogin");

if (googleLogin) {

    googleLogin.addEventListener("click", async () => {

        const errorMessage =
            document.getElementById("errorMessage");

        try {

            const provider =
                new GoogleAuthProvider();

            const result =
                await signInWithPopup(
                    auth,
                    provider
                );

            const user =
                result.user;

            await setDoc(
                doc(
                    db,
                    "users",
                    user.uid
                ),
                {
                    name:
                        user.displayName ||
                        "Student",

                    email:
                        user.email || "",

                    createdAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );

            window.location.href =
                "home.html";

        } catch (error) {

            console.log(
                "Google login error:",
                error
            );

            errorMessage.textContent =
                "Google login failed: " +
                error.message;

        }

    });

}


/* FORGOT PASSWORD */

const forgotPassword =
    document.getElementById("forgotPassword");

if (forgotPassword) {

    forgotPassword.addEventListener("click", async () => {

        const email =
            document.getElementById("email").value.trim();

        const errorMessage =
            document.getElementById("errorMessage");

        if (!email) {

            errorMessage.textContent =
                "Please enter your email first.";

            document.getElementById("email").focus();

            return;
        }

        errorMessage.textContent =
            "Sending password reset email...";

        try {

            await sendPasswordResetEmail(
                auth,
                email
            );

            errorMessage.textContent =
                "Password reset email sent. Check your inbox and spam folder.";

        } catch (error) {

            console.log("Password reset error:", error);

            errorMessage.textContent =
                "Password reset failed: " + error.code;

        }

    });

}


/* SIGN UP */

const signupForm =
    document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const errorMessage =
            document.getElementById("errorMessage");


        if (password !== confirmPassword) {

            errorMessage.textContent =
                "Passwords do not match.";

            return;
        }


        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            await updateProfile(
                userCredential.user,
                {
                    displayName: name
                }
            );


            await setDoc(
                doc(
                    db,
                    "users",
                    userCredential.user.uid
                ),
                {
                    name: name,
                    email: email,
                    createdAt: serverTimestamp()
                }
            );


            window.location.href = "home.html";

        } catch (error) {

            console.log(error);

            errorMessage.textContent =
                "Could not create account. " +
                error.message;

        }

    });

}