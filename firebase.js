import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc,
  collection,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDtabM11H19VclSMxwage4ZDXxKTvgsvu4",
  authDomain: "book-sahayak.firebaseapp.com",
  projectId: "book-sahayak",
  storageBucket: "book-sahayak.firebasestorage.app",
  messagingSenderId: "758198853938",
  appId: "1:758198853938:web:39da7e56484944c9b1372b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const PRESENCE_HEARTBEAT_MS = 30000;
const PRESENCE_TIMEOUT_MS = 60000;

let activeUser = null;
let heartbeatId = null;
let stopWatchingPresence = null;
let stopWatchingUnreadMessages = null;

async function updatePresence(isOnline) {
  if (!activeUser) return;

  try {
    await setDoc(
      doc(db, "users", activeUser.uid),
      {
        isOnline,
        lastSeen: serverTimestamp()
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Could not update presence:", error);
  }
}

function showChatPresence(userId) {
  if (!userId || !window.location.pathname.endsWith("chat.html")) return;

  const statusElement = document.getElementById("chatStatus");
  if (!statusElement) return;

  stopWatchingPresence?.();

  stopWatchingPresence = onSnapshot(
    doc(db, "users", userId),
    (snapshot) => {
      const presence = snapshot.data();
      const lastSeen = presence?.lastSeen?.toDate?.();
      const isRecentlyActive =
        lastSeen && Date.now() - lastSeen.getTime() < PRESENCE_TIMEOUT_MS;
      const isOnline = presence?.isOnline === true && isRecentlyActive;

      statusElement.textContent = isOnline ? "Online" : "Offline";
      statusElement.classList.toggle("is-online", isOnline);
      statusElement.classList.toggle("is-offline", !isOnline);
    },
    () => {
      statusElement.textContent = "Offline";
      statusElement.classList.remove("is-online");
      statusElement.classList.add("is-offline");
    }
  );
}

function showUnreadMessages(count) {
  document.querySelectorAll(".nav-chat-link").forEach((link) => {
    let badge = link.querySelector(".unread-messages-badge");

    if (!badge) {
      badge = document.createElement("span");
      badge.className = "unread-messages-badge";
      badge.setAttribute("aria-live", "polite");
      link.appendChild(badge);
    }

    badge.textContent = count > 99 ? "99+" : String(count);
    badge.hidden = count === 0;
    link.setAttribute(
      "aria-label",
      count === 0 ? "Messages" : `Messages, ${count} unread`
    );
  });
}

function showMessageToast(chat) {
  const senderName = chat.lastMessageSenderName || "Someone";
  const messageText = chat.lastMessage || "sent you a message";
  const existingToast = document.querySelector(".message-notification-toast");

  existingToast?.remove();

  const toast = document.createElement("button");
  const title = document.createElement("strong");
  const preview = document.createElement("span");

  toast.type = "button";
  toast.className = "message-notification-toast";
  title.textContent = `💬 New message from ${senderName}`;
  preview.textContent = messageText;
  toast.append(title, preview);
  toast.addEventListener("click", () => {
    window.location.href = "chats.html";
  });

  document.body.appendChild(toast);

  window.setTimeout(() => toast.remove(), 6000);
}

function watchUnreadMessages(userId) {
  stopWatchingUnreadMessages?.();

  let receivedInitialSnapshot = false;

  stopWatchingUnreadMessages = onSnapshot(
    collection(db, "chats"),
    (snapshot) => {
      let total = 0;

      snapshot.forEach((chatDocument) => {
        const chat = chatDocument.data();
        const isParticipant =
          chat.buyerId === userId ||
          chat.sellerId === userId ||
          chat.participants?.includes?.(userId);

        if (isParticipant) {
          total += Number(chat.unreadCounts?.[userId] || 0);
        }
      });

      showUnreadMessages(total);

      if (receivedInitialSnapshot) {
        snapshot.docChanges().forEach((change) => {
          const chat = change.doc.data();
          const hasNewIncomingMessage =
            (change.type === "added" || change.type === "modified") &&
            chat.lastMessageSenderId !== userId &&
            Boolean(chat.lastMessage);

          if (hasNewIncomingMessage) {
            showMessageToast(chat);
          }
        });
      }

      receivedInitialSnapshot = true;
    },
    () => showUnreadMessages(0)
  );
}

onAuthStateChanged(auth, (user) => {
  if (heartbeatId) {
    clearInterval(heartbeatId);
    heartbeatId = null;
  }

  if (!user) {
    const signedOutUser = activeUser;
    activeUser = null;
    stopWatchingUnreadMessages?.();
    stopWatchingUnreadMessages = null;
    showUnreadMessages(0);

    if (signedOutUser) {
      setDoc(
        doc(db, "users", signedOutUser.uid),
        { isOnline: false, lastSeen: serverTimestamp() },
        { merge: true }
      ).catch(() => {});
    }

    return;
  }

  activeUser = user;

  updatePresence(true);
  heartbeatId = setInterval(() => updatePresence(!document.hidden), PRESENCE_HEARTBEAT_MS);

  const params = new URLSearchParams(window.location.search);
  const otherUserId =
    params.get("user") ||
    params.get("userId") ||
    params.get("otherUserId") ||
    params.get("sellerId") ||
    params.get("recipientId");

  showChatPresence(otherUserId);
  watchUnreadMessages(user.uid);
});

document.addEventListener("visibilitychange", () => updatePresence(!document.hidden));
window.addEventListener("pagehide", () => updatePresence(false));
