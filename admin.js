import { auth, db, ADMIN_UID } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    collection,
    doc,
    getDocs,
    serverTimestamp,
    updateDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const pendingMaterials = document.getElementById("pendingMaterials");
const adminMessage = document.getElementById("adminMessage");
const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const legacyCount = document.getElementById("legacyCount");
const migrationPanel = document.getElementById("migrationPanel");
const approveExistingBtn = document.getElementById("approveExistingBtn");

function setMessage(text) {
    adminMessage.textContent = text;
}

function makeTextElement(tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
}

async function reviewMaterial(id, status, card) {
    const action = status === "approved" ? "Approving" : "Rejecting";

    try {
        const buttons = card.querySelectorAll("button");
        buttons.forEach((button) => { button.disabled = true; });
        setMessage(`${action} listing…`);

        await updateDoc(doc(db, "materials", id), {
            status,
            reviewedAt: serverTimestamp(),
            reviewedBy: auth.currentUser.uid
        });

        await loadPendingMaterials();

        setMessage(
            status === "approved"
                ? "Listing approved and published."
                : "Listing rejected. The uploader can see its rejected status in My Materials."
        );
    } catch (error) {
        setMessage(`Could not review listing: ${error.message}`);
        card.querySelectorAll("button").forEach((button) => { button.disabled = false; });
    }
}

function createReviewCard(materialDocument) {
    const material = materialDocument.data();
    const card = document.createElement("article");
    card.className = "admin-material-card";

    card.append(
        makeTextElement("span", material.category || "Resource", "admin-category"),
        makeTextElement("h2", material.title || "Untitled material"),
        makeTextElement("p", `Subject: ${material.subject || "Not specified"}`),
        makeTextElement("p", material.description || "No description provided.", "admin-card-description"),
        makeTextElement("p", `Submitted by: ${material.uploaderName || "Student"}`),
        makeTextElement("p", `Contact: ${material.contactNumber || "Not provided"}`)
    );

    if (material.fileURL) {
        const fileLink = document.createElement("a");
        fileLink.href = material.fileURL;
        fileLink.target = "_blank";
        fileLink.rel = "noopener";
        fileLink.textContent = `View file: ${material.fileName || "attachment"}`;
        fileLink.className = "admin-file-link";
        card.append(fileLink);
    }

    const actions = document.createElement("div");
    actions.className = "admin-review-actions";
    const approveButton = makeTextElement("button", "Approve", "admin-approve-btn");
    const rejectButton = makeTextElement("button", "Reject", "admin-reject-btn");
    approveButton.type = "button";
    rejectButton.type = "button";
    approveButton.addEventListener("click", () => reviewMaterial(materialDocument.id, "approved", card));
    rejectButton.addEventListener("click", () => reviewMaterial(materialDocument.id, "rejected", card));
    actions.append(approveButton, rejectButton);
    card.append(actions);

    return card;
}

async function loadPendingMaterials() {
    try {
        const snapshot = await getDocs(collection(db, "materials"));
        const pending = snapshot.docs.filter((item) => item.data().status === "pending");
        const approved = snapshot.docs.filter((item) => item.data().status === "approved");
        const legacy = snapshot.docs.filter((item) => !item.data().status);
        pendingMaterials.innerHTML = "";
        pendingCount.textContent = pending.length;
        approvedCount.textContent = approved.length;
        legacyCount.textContent = legacy.length;
        migrationPanel.hidden = legacy.length === 0;

        if (pending.length === 0) {
            setMessage("No listings are waiting for review.");
            return;
        }

        pending.forEach((item) => pendingMaterials.append(createReviewCard(item)));
        setMessage(`${pending.length} listing${pending.length === 1 ? "" : "s"} awaiting review.`);
    } catch (error) {
        setMessage(`Could not load pending listings: ${error.message}`);
    }
}

async function approveExistingListings() {
    try {
        approveExistingBtn.disabled = true;
        setMessage("Approving existing listings…");
        const snapshot = await getDocs(collection(db, "materials"));
        const legacy = snapshot.docs.filter((item) => !item.data().status);

        if (legacy.length === 0) {
            await loadPendingMaterials();
            return;
        }

        const batch = writeBatch(db);
        legacy.forEach((item) => {
            batch.update(item.ref, {
                status: "approved",
                reviewedAt: serverTimestamp(),
                reviewedBy: auth.currentUser.uid
            });
        });
        await batch.commit();
        setMessage(`${legacy.length} existing listing${legacy.length === 1 ? "" : "s"} approved.`);
        await loadPendingMaterials();
    } catch (error) {
        setMessage(`Could not approve existing listings: ${error.message}`);
    } finally {
        approveExistingBtn.disabled = false;
    }
}

approveExistingBtn?.addEventListener("click", approveExistingListings);

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    if (user.uid !== ADMIN_UID) {
        pendingMaterials.innerHTML = "";
        setMessage("You do not have permission to access this page.");
        return;
    }

    loadPendingMaterials();
});
