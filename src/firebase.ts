import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc
} from "firebase/firestore";

// Safe helper to dynamically retrieve environment variables across environments (Vite or Process)
// without throwing "ReferenceError: process is not defined" in the browser.
function getEnvValue(key: string): string | undefined {
  try {
    const metaCast = import.meta as any;
    if (typeof import.meta !== "undefined" && metaCast && metaCast.env) {
      if (metaCast.env[key]) return metaCast.env[key];
      if (metaCast.env[`VITE_${key}`]) return metaCast.env[`VITE_${key}`];
      if (metaCast.env[`NEXT_PUBLIC_${key}`]) return metaCast.env[`NEXT_PUBLIC_${key}`];
    }
  } catch (e) {
    // Ignore meta access issues if any
  }

  try {
    const processCast = (typeof process !== "undefined" ? process : undefined) as any;
    if (processCast && processCast.env) {
      if (processCast.env[key]) return processCast.env[key];
      if (processCast.env[`VITE_${key}`]) return processCast.env[`VITE_${key}`];
      if (processCast.env[`NEXT_PUBLIC_${key}`]) return processCast.env[`NEXT_PUBLIC_${key}`];
    }
  } catch (e) {
    // Ignore process access issues if any
  }

  return undefined;
}

// The Web App's Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: getEnvValue("FIREBASE_API_KEY") || "AIzaSyAA4eA71_D84PubK7XMh-QJtT69-O4Glok",
  authDomain: getEnvValue("FIREBASE_AUTH_DOMAIN") || "khalabweb-4117f.firebaseapp.com",
  projectId: getEnvValue("FIREBASE_PROJECT_ID") || "khalabweb-4117f",
  storageBucket: getEnvValue("FIREBASE_STORAGE_BUCKET") || "khalabweb-4117f.firebasestorage.app",
  messagingSenderId: getEnvValue("FIREBASE_MESSAGING_SENDER_ID") || "806560423240",
  appId: getEnvValue("FIREBASE_APP_ID") || "1:806560423240:web:e4ca88b0e21851b30c277d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Validate Connection to Firestore on startup (required by skill rules)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration or connectivity.");
    }
  }
}
testConnection();

// --- Error Handler Helper ---
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Hooked: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Dynamic Phone Auth Simulation & Operations ---
/**
 * Automatically creates/signs-in a Firebase Auth user based deterministically
 * on their phone number, and inserts their profile details into Firestore under /users/{uid}.
 */
export async function autoSignInAndRegisterByPhone(
  phoneNumber: string,
  fullName: string,
  address: string,
  city: string
): Promise<FirebaseUser> {
  const cleanPhone = phoneNumber.trim().replace(/[^0-9]/g, "");
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error("Invalid phone number format for auto auth");
  }

  const email = `phone_${cleanPhone}@khalab.com`;
  const password = `khalab_pwd_${cleanPhone}`;

  let user: FirebaseUser;

  try {
    // 1. Try signing in
    const credential = await signInWithEmailAndPassword(auth, email, password);
    user = credential.user;
    console.log("Logged in existing user session for phone:", phoneNumber);
  } catch (err: any) {
    // If user does not exist, create a new one
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/invalid-email") {
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        user = credential.user;
        console.log("Registered new user session for phone:", phoneNumber);
      } catch (createErr) {
        console.error("Failed to create user with phone email, trying secondary credential fallback", createErr);
        throw createErr;
      }
    } else {
      console.error("Auth sign in failed:", err);
      throw err;
    }
  }

  // 2. Save customer profile document in Firestore (under users collect / user's authentic UID)
  try {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      fullName,
      phoneNumber,
      address,
      city,
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log("Successfully synchronized user profile in Firestore");
  } catch (firestoreErr) {
    handleFirestoreError(firestoreErr, OperationType.WRITE, `users/${user.uid}`);
  }

  return user;
}

/**
 * Stores details of a finished order inside Firestore.
 */
export async function storeOrderInFirestore(order: any, userId: string) {
  try {
    const orderDocRef = doc(db, "orders", order.id);
    await setDoc(orderDocRef, {
      ...order,
      userId,
      syncedAt: new Date().toISOString()
    });
    console.log(`Uploaded copy of Order ${order.id} to Firestore`);
  } catch (firestoreErr) {
    handleFirestoreError(firestoreErr, OperationType.WRITE, `orders/${order.id}`);
  }
}

/**
 * Retrieves list of orders placed by the currently logged-in user from Firestore.
 */
export async function getUserOrdersFromFirestore(userId: string): Promise<any[]> {
  const ordersPath = "orders";
  try {
    const q = query(collection(db, ordersPath), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const orderList: any[] = [];
    querySnapshot.forEach((docSnap) => {
      orderList.push({ id: docSnap.id, ...docSnap.data() });
    });
    return orderList;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, ordersPath);
    return [];
  }
}

// --- Dynamic Mock API Overloading utilizing client-side Firebase directly ---

const defaultConfig = {
  storeName: "KHALAB",
  storeTagline: "MAKE YOUR SELF PREMIUM.",
  customLogo: "",
  contactPhone: "+880 1711-234567",
  contactEmail: "info@khalab.com",
  currency: "BDT",
  deliveryChargeInside: 100,
  deliveryChargeOutside: 150,
  promos: [
    {
      code: "KHALAB500",
      discount: 500,
      type: "fixed",
      description: "Flat 500 BDT off on orders above 3000 BDT",
      active: true
    },
    {
      code: "PREMIUM20",
      discount: 20,
      type: "percentage",
      description: "Get 20% discount on entire cart!",
      active: true
    }
  ],
  themeMode: "slate",
  customPrimary: "#047857",
  customSecondary: "#065f46"
};

const defaultProducts = [
  {
    id: "p1",
    title: "KHALAB Royal Festive Panjabi",
    description: "Handcrafted Premium semi-wool blended Panjabi featuring detailed classic embroidery on collar and placket. Intended for religious festivities and premium casual styling.",
    price: 3200,
    sizes: ["M", "L", "XL", "XXL"],
    images: ["https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Panjabi",
    catalog: "Festive Collection",
    inventory: 15,
    rating: 4.8,
    reviewCount: 14,
    featured: true
  },
  {
    id: "p2",
    title: "Minimalist Soft Linen Panjabi",
    description: "100% pure linen breathability in soft paste green. Clean silhouette with subtle pearl buttons. Elegant, comfortable and absolutely premium.",
    price: 2400,
    sizes: ["S", "M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Panjabi",
    catalog: "Summer Style '26",
    inventory: 8,
    rating: 4.6,
    reviewCount: 9,
    featured: true
  },
  {
    id: "p3",
    title: "Italian-cut Cotton Oxford Shirt",
    description: "Premium double-ply long-staple cotton tailoring with modern cutaway collar. Double buttons cuff and smooth clean finish.",
    price: 1850,
    sizes: ["M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Shirts",
    catalog: "Summer Style '26",
    inventory: 12,
    rating: 4.5,
    reviewCount: 18,
    featured: true
  },
  {
    id: "p4",
    title: "Japanese Vintage Selvedge Jeans",
    description: "Deep indigo raw Japanese denim with selvedge trim details. Tailored mid-rise slim straight fit that develops custom whiskers with wear.",
    price: 2950,
    sizes: ["30", "32", "34", "36"],
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Pants",
    catalog: "Summer Style '26",
    inventory: 10,
    rating: 4.7,
    reviewCount: 7
  },
  {
    id: "p5",
    title: "KHALAB Signature Heavyweight Hoodie",
    description: "420 GSM ultra-dense loopback French Terry fabric cotton. Dropped shoulders, seamless kangaroo pocket, and elegant embossed KHALAB insignia.",
    price: 3600,
    sizes: ["M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Hoodies",
    catalog: "Festive Collection",
    inventory: 5,
    rating: 4.9,
    reviewCount: 16,
    featured: true
  }
];

const defaultCategories = [
  { id: "c1", name: "Panjabi", description: "Traditional luxury festive apparel" },
  { id: "c2", name: "Shirts", description: "Premium formal and semi-formal wear" },
  { id: "c3", name: "Pants", description: "Superb chinos, denim, and trousers" },
  { id: "c4", name: "Hoodies", description: "Luxury street wear and outerwear" }
];

const defaultCatalogs = [
  { id: "cat1", name: "Summer Style '26", subtitle: "Stay breezy and dapper in premium linen and cotton blends" },
  { id: "cat2", name: "Festive Collection", subtitle: "Pristine embroidered Panjabis and luxury outfits for celebrations" }
];

const defaultReviews = [
  {
    id: "r1",
    productId: "p1",
    userName: "Arman Khan",
    rating: 5,
    comment: "The embroidery is top notch, fabric feels extremely premium. Perfect fit for Eid!",
    date: "2026-06-10"
  },
  {
    id: "r2",
    productId: "p1",
    userName: "Zahid Hasan",
    rating: 4,
    comment: "Very elegant, though I suggest ordering a size up if you like loose fit. Overall 10/10.",
    date: "2026-06-12"
  },
  {
    id: "r3",
    productId: "p3",
    userName: "Maherab Hossain",
    rating: 5,
    comment: "Excellent shirt structure! The double cuffs feel solid structure. Highly recommended.",
    date: "2026-06-14"
  }
];

export async function handleFirebaseMockFetch(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  const urlObj = new URL(pathWithQuery, "https://mock.api");
  const cleanPath = urlObj.pathname;
  const method = (init?.method || "GET").toUpperCase();
  
  // Parse body if present
  let bodyData: any = null;
  if (init?.body) {
    try {
      bodyData = JSON.parse(init.body as string);
    } catch (e) {
      console.error("Failed to parse request body in mock fetch:", e);
    }
  }

  const respondJSON = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    // 1. /api/config
    if (cleanPath === "/api/config") {
      const docRef = doc(db, "config", "global");
      if (method === "GET") {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return respondJSON(snap.data());
        } else {
          await setDoc(docRef, defaultConfig);
          return respondJSON(defaultConfig);
        }
      } else if (method === "POST" || method === "PUT") {
        await setDoc(docRef, bodyData, { merge: true });
        return respondJSON({ success: true, config: bodyData });
      }
    }

    // 2. /api/products
    if (cleanPath === "/api/products") {
      if (method === "GET") {
        const qDocs = await getDocs(collection(db, "products"));
        const list: any[] = [];
        qDocs.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length === 0) {
          for (const item of defaultProducts) {
            await setDoc(doc(db, "products", item.id), item);
            list.push(item);
          }
        }
        return respondJSON(list);
      } else if (method === "POST") {
        const id = bodyData.id || `p_${Date.now()}`;
        const newProd = { ...bodyData, id };
        await setDoc(doc(db, "products", id), newProd);
        return respondJSON({ success: true, product: newProd });
      }
    }

    // Single product /api/products/:id
    if (cleanPath.startsWith("/api/products/")) {
      const id = cleanPath.substring("/api/products/".length);
      const docRef = doc(db, "products", id);
      if (method === "PUT") {
        await setDoc(docRef, bodyData, { merge: true });
        return respondJSON({ success: true, product: bodyData });
      } else if (method === "DELETE") {
        await deleteDoc(docRef);
        return respondJSON({ success: true });
      } else if (method === "GET") {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return respondJSON({ id, ...snap.data() });
        }
        return respondJSON({ error: "Product not found" }, 404);
      }
    }

    // 3. /api/categories / /api/category
    if (cleanPath === "/api/categories" || cleanPath === "/api/category") {
      if (method === "GET") {
        const qDocs = await getDocs(collection(db, "categories"));
        const list: any[] = [];
        qDocs.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length === 0) {
          for (const item of defaultCategories) {
            await setDoc(doc(db, "categories", item.id), item);
            list.push(item);
          }
        }
        return respondJSON(list);
      } else if (method === "POST") {
        const id = bodyData.id || `c_${Date.now()}`;
        const newCat = { ...bodyData, id };
        await setDoc(doc(db, "categories", id), newCat);
        return respondJSON({ success: true, category: newCat });
      }
    }

    // 4. /api/catalogs / /api/catalog
    if (cleanPath === "/api/catalogs" || cleanPath === "/api/catalog") {
      if (method === "GET") {
        const qDocs = await getDocs(collection(db, "catalogs"));
        const list: any[] = [];
        qDocs.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length === 0) {
          for (const item of defaultCatalogs) {
            await setDoc(doc(db, "catalogs", item.id), item);
            list.push(item);
          }
        }
        return respondJSON(list);
      } else if (method === "POST") {
        const id = bodyData.id || `cat_${Date.now()}`;
        const newCatalog = { ...bodyData, id };
        await setDoc(doc(db, "catalogs", id), newCatalog);
        return respondJSON({ success: true, catalog: newCatalog });
      }
    }

    // 5. /api/orders / /api/orders/:id
    if (cleanPath === "/api/orders") {
      if (method === "GET") {
        const qDocs = await getDocs(collection(db, "orders"));
        const list: any[] = [];
        qDocs.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        return respondJSON(list);
      } else if (method === "POST") {
        const id = bodyData.id || `o_${Date.now()}`;
        const newOrder = { ...bodyData, id };
        await setDoc(doc(db, "orders", id), newOrder);
        return respondJSON({ success: true, order: newOrder });
      }
    }

    if (cleanPath.startsWith("/api/orders/")) {
      const id = cleanPath.substring("/api/orders/".length);
      const docRef = doc(db, "orders", id);
      if (method === "PUT") {
        await setDoc(docRef, bodyData, { merge: true });
        return respondJSON({ success: true, order: bodyData });
      } else if (method === "DELETE") {
        await deleteDoc(docRef);
        return respondJSON({ success: true });
      }
    }

    // 6. /api/reviews
    if (cleanPath === "/api/reviews") {
      if (method === "GET") {
        const qDocs = await getDocs(collection(db, "reviews"));
        const list: any[] = [];
        qDocs.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length === 0) {
          for (const item of defaultReviews) {
            await setDoc(doc(db, "reviews", item.id), item);
            list.push(item);
          }
        }
        return respondJSON(list);
      } else if (method === "POST") {
        const id = bodyData.id || `r_${Date.now()}`;
        const newReview = { ...bodyData, id };
        await setDoc(doc(db, "reviews", id), newReview);
        return respondJSON({ success: true, review: newReview });
      }
    }

    // 7. /api/notifications / /api/notifications/push
    if (cleanPath === "/api/notifications" || cleanPath === "/api/notifications/push") {
      if (method === "GET") {
        const qDocs = await getDocs(collection(db, "notifications"));
        const list: any[] = [];
        qDocs.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        if (list.length === 0) {
          const defaultNotif = {
            id: "n-welcome",
            title: "Welcome to KHALAB Store!",
            message: "Discover modern, premium clothing tailored with love. Enjoy free shipping on your first purchase!",
            date: new Date().toISOString().split('T')[0],
            type: "promo"
          };
          await setDoc(doc(db, "notifications", defaultNotif.id), defaultNotif);
          list.push(defaultNotif);
        }
        return respondJSON(list);
      } else if (method === "POST") {
        const id = bodyData.id || `n_${Date.now()}`;
        const newNotif = { ...bodyData, id };
        await setDoc(doc(db, "notifications", id), newNotif);
        return respondJSON({ success: true, notification: newNotif });
      }
    }

    // 8. /api/upload
    if (cleanPath === "/api/upload") {
      if (method === "POST") {
        return respondJSON({ url: bodyData?.base64Data || "" });
      }
    }

    return respondJSON({ error: `Mock endpoint path ${cleanPath} not matched` }, 404);
  } catch (err: any) {
    console.error("Firestore mock fetch failure:", err);
    return respondJSON({ error: err.message || "Failed client-side sync request" }, 500);
  }
}
