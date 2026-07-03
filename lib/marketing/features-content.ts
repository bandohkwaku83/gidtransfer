export type FeatureSurface = "client" | "dashboard" | "both";

export type FeatureSectionGroup = "client" | "studio";

export type FeatureSpotlight = {
  id: string;
  section: FeatureSectionGroup;
  eyebrow: string;
  headline: string;
  outcome: string;
  description: string;
  bullets: readonly string[];
  surface: FeatureSurface;
  visual:
    | {
        type: "gallery-cover";
        src: string;
        alt: string;
        title: string;
        coverFrame: "cinematic" | "minimal" | "editorial-card" | "overlay" | "collage" | "bento";
        coverColor?: string;
      }
    | {
        type: "phone";
        src: string;
        alt: string;
        title: string;
        coverColor?: string;
      }
    | {
        type: "photo";
        src: string;
        alt: string;
      };
};

export const featureTrustPoints = [
  "No client signup",
  "Your logo on every gallery",
  "30-day free trial",
  "Cancel anytime",
] as const;

export const featureStats = [
  { value: "12", suffix: "+", label: "Cover frame styles" },
  { value: "7", label: "Client grid layouts" },
  { value: "0", suffix: "%", label: "Commission on prints" },
  { value: "30", label: "Day free trial" },
] as const;

export const featureTestimonialRating = {
  score: "4.9",
  label: "Loved by working photographers",
} as const;

export const featureWhySwitch = [
  {
    title: "Clients open it — and remember it",
    description:
      "Cinematic covers, editorial grids, and a mobile lightbox. Deliveries clients screenshot and share — not another download link they forget.",
  },
  {
    title: "One studio, not five tabs",
    description:
      "Upload, design, proof, and deliver from one gallery workspace. Replace the WeTransfer + email + spreadsheet stack with a single branded link.",
  },
  {
    title: "Your brand. Your rules.",
    description:
      "Studio logo on every page, PIN gates when you need them, watermarked previews, and locked finals until payment clears.",
  },
] as const;

export const featureWorkflowSteps = [
  { label: "Upload", description: "Raws, video & sets" },
  { label: "Design", description: "Cover, fonts & brand" },
  { label: "Share", description: "One branded link" },
  { label: "Proof", description: "Hearts & comments" },
  { label: "Deliver", description: "Finals & downloads" },
] as const;

export const featureSectionHeaders = {
  client: {
    eyebrow: "What clients see",
    title: "A gallery link worth opening",
    description:
      "This is what lands in your client's inbox — a branded experience that sells your work before they scroll to image two.",
  },
  studio: {
    eyebrow: "What you run",
    title: "The dashboard behind every delivery",
    description:
      "Upload, customise, publish, and track — plus clients, bookings, and income in the same studio where your galleries live.",
  },
} as const;

export const featureTestimonial = {
  quote:
    "Gidtransfer doesn't just deliver my photos — it delivers my reputation. Clients are blown away by how professional the galleries look.",
  name: "Ama Boateng",
  role: "Wedding photographer, Accra",
  avatar:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
} as const;

export const featurePlatformModules = [
  "Branded client gallery — cover, tabs & lightbox",
  "Selection, comments & one-click submit",
  "Gallery workspace — upload, design & go live",
  "Clients, bookings & income in one place",
  "PIN gate, watermarks & locked finals",
  "Share via link, WhatsApp or SMS",
] as const;

export const featureSpotlights: readonly FeatureSpotlight[] = [
  {
    id: "client-gallery",
    section: "client",
    eyebrow: "Client gallery link",
    headline: "Deliveries that look as good as your images",
    outcome: "Clients say \"wow\" before they scroll",
    description:
      "Send one branded link — no client account needed. They land on a full-bleed cover hero, switch between seven grid layouts, and browse in a zoom lightbox built for phones.",
    bullets: [
      "12 cover frames — cinematic, collage, bento & editorial",
      "7 layouts clients can switch: masonry, uniform, adaptive & more",
      "Originals, Selected & Finals tabs — clear and intuitive",
      "Zoom lightbox with prev/next — works on any device",
    ],
    surface: "client",
    visual: {
      type: "gallery-cover",
      src: "/images/gallery-covers/WOED0075.JPG",
      alt: "Wedding ceremony gallery cover",
      title: "Sarah & James",
      coverFrame: "cinematic",
      coverColor: "#4c0519",
    },
  },
  {
    id: "proofing",
    section: "client",
    eyebrow: "Selection & proofing",
    headline: "Stop chasing picks over email",
    outcome: "Approvals in one sitting, not ten threads",
    description:
      "Clients heart favourites, leave notes on any image, and submit when they're done. You watch live progress from your dashboard — no \"did you see my last email?\"",
    bullets: [
      "Set a selection limit per gallery",
      "Per-photo comments with your replies in-dashboard",
      "Submit locks the gallery for the client",
      "Selected tab keeps picks even when browse changes",
    ],
    surface: "both",
    visual: {
      type: "phone",
      src: "/images/gallery-covers/IMG_5261.JPG",
      alt: "Family portrait gallery on mobile",
      title: "The Mensah Family",
      coverColor: "#14532d",
    },
  },
  {
    id: "gallery-workspace",
    section: "studio",
    eyebrow: "Gallery dashboard",
    headline: "From upload to go-live in one folder",
    outcome: "Hours back every shoot",
    description:
      "Every job is a gallery workspace: batch upload raws, style the client preview in a live design tab, flip online when you're ready, and share via link, WhatsApp, or SMS.",
    bullets: [
      "Batch upload photos, videos & camera RAW",
      "Design tab with live desktop & mobile preview",
      "Publish toggle — copy link or notify client by SMS",
      "Draft → Selecting → Completed — always know where you stand",
    ],
    surface: "dashboard",
    visual: {
      type: "photo",
      src: "/images/client.jpg",
      alt: "Client viewing a photo gallery on a phone",
    },
  },
  {
    id: "studio",
    section: "studio",
    eyebrow: "Studio tools",
    headline: "Run the business without leaving delivery",
    outcome: "Less admin, more shooting",
    description:
      "Client contacts, a booking calendar, and an income ledger live beside your galleries — so you're not copying names between Calendly, spreadsheets, and your gallery tool.",
    bullets: [
      "Client directory with CSV import",
      "Booking calendar with shoot types & session amounts",
      "Booking invoice PDFs — download or share instantly",
      "Income ledger with paid, pending & partial status",
    ],
    surface: "dashboard",
    visual: {
      type: "photo",
      src: "/images/appointment.png",
      alt: "Photographer scheduling a client session",
    },
  },
  {
    id: "brand-protect",
    section: "studio",
    eyebrow: "Brand & protect",
    headline: "Your name on the link. Your rules on the files.",
    outcome: "Premium delivery, protected work",
    description:
      "Studio logo and custom fonts on every gallery. PIN or email gate before clients enter. Watermarked previews on originals, and locked finals until payment clears.",
    bullets: [
      "Studio logo, name & custom gallery URL slug",
      "Cover colours, Google fonts & 12 frame styles",
      "4-digit PIN or email gate on the share link",
      "Preview watermarks & pay-to-unlock finals",
    ],
    surface: "both",
    visual: {
      type: "gallery-cover",
      src: "/images/gallery-covers/Amoa-Mensa_0571-min.jpg",
      alt: "Engagement gallery cover",
      title: "Amoa & Mensa",
      coverFrame: "overlay",
      coverColor: "#1e3a5f",
    },
  },
] as const;

export const featureSurfaceLabels: Record<FeatureSurface, string> = {
  client: "Client gallery link",
  dashboard: "Your dashboard",
  both: "Client link & dashboard",
};
