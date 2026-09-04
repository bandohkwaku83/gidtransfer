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
  "30-day free trial",
  "Share links & selections",
  "Cancel anytime",
] as const;

export const featureStats = [
  { value: "5", suffix: " GB", label: "Trial storage" },
  { value: "3", label: "Trial galleries" },
  { value: "30", label: "Day free trial" },
  { value: "4", label: "Plans to grow into" },
] as const;

export const featureTestimonialRating = {
  score: "4.9",
  label: "Loved by working photographers",
} as const;

export const featureWhySwitch = [
  {
    title: "One branded link per shoot",
    description:
      "Create a private gallery, send a share link, and let clients heart favourites — without accounts, zip files, or chasing picks over email.",
  },
  {
    title: "Studio tools beside delivery",
    description:
      "Bookings and reminders, a client list, income tracking, labels, and analytics live next to your galleries — not in five other apps.",
  },
  {
    title: "Grow into SMS, video, AI, and teams",
    description:
      "Start on the free trial. Upgrade for SMS, video, branding, and trash restore — then Premium for Gallery AI, a studio team of up to 10, and collaboration workspaces with other photographers.",
  },
] as const;

export const featureWorkflowSteps = [
  {
    label: "Upload",
    description:
      "Drop the shoot into a private client gallery — organised and ready before anyone opens the link.",
  },
  {
    label: "Protect",
    description:
      "Add a password gate, text watermarks on previews, and download rules — allow, limit, or block.",
  },
  {
    label: "Share",
    description:
      "Send one public share link. No client account. Notify by SMS on Basic and above when you go live.",
  },
  {
    label: "Proof",
    description:
      "Clients heart favourites and submit. Comments and flags unlock on Basic; Gallery AI smart picks on Premium.",
  },
  {
    label: "Deliver",
    description:
      "Unlock downloads when you're ready. Pro and Premium can burn your studio logo onto the files.",
  },
] as const;

export const featureSectionHeaders = {
  client: {
    eyebrow: "What clients see",
    title: "A private gallery link worth opening",
    description:
      "Share links, heart picks, password gates, and download control — the client experience from the free trial up. Premium adds Gallery AI smart picks on the link.",
  },
  studio: {
    eyebrow: "What you run",
    title: "The studio behind every delivery",
    description:
      "Galleries, bookings, clients, income, SMS, and analytics on every paid path — plus Gallery AI, studio team seats, and photographer collaboration on Premium.",
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
  "Client galleries & share links",
  "Selections, password gate & download control",
  "Bookings, CRM & income tracking",
  "SMS share notifications (Basic+)",
  "Video uploads & adaptive streaming (Basic+)",
  "Gallery AI, studio team & photographer collab (Premium)",
] as const;

export const featureSpotlights: readonly FeatureSpotlight[] = [
  {
    id: "client-gallery",
    section: "client",
    eyebrow: "Client galleries",
    headline: "A private gallery per client or shoot",
    outcome: "One link. No client account.",
    description:
      "Create a client gallery, send a public share link, and let them open proofs on any device — included from the free trial. Premium unlocks unlimited galleries.",
    bullets: [
      "Client galleries — one private space per shoot",
      "Share links — a public URL for proofs",
      "Client selections — hearts and favourites you can see",
      "Password protection before viewing when you need it",
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
    eyebrow: "Selections & delivery control",
    headline: "Hearts, comments, and download rules",
    outcome: "Approvals without the email chase",
    description:
      "Clients pick favourites and submit. You control downloads and watermarks. Commenting and flagging unlock on Basic; on Premium, clients can also run Gallery AI smart picks on the share link.",
    bullets: [
      "Client selections with a clear submit flow",
      "Download control — allow, limit, or block",
      "Text watermarks on preview and selection images",
      "Comment & flag images from Basic upward",
      "Gallery AI smart picks on the client link (Premium)",
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
    eyebrow: "Gallery workspace",
    headline: "Upload, organise, and go live",
    outcome: "From shoot to share link in one place",
    description:
      "Build the gallery in your dashboard: upload media, organise with labels and tags, group into sets on paid plans, and publish when you're ready. Storage scales from 5 GB on trial to 250 GB on Premium.",
    bullets: [
      "Labels & tags to organise galleries and photos",
      "Sets within a gallery from Basic upward",
      "Video uploads — 5 GB Basic, 10 GB Pro, 20 GB Premium",
      "Adaptive video (MPEG-DASH) so quality follows the client's network",
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
    headline: "Bookings, clients, income, and SMS",
    outcome: "Less admin around every shoot",
    description:
      "Run the business next to delivery: shoot calendar, reminders, client contacts, and income summaries — plus SMS when you share on Basic and up.",
    bullets: [
      "Bookings calendar and automatic shoot reminders",
      "Client management with phone, email, and notes",
      "Income tracking for payments and summaries",
      "SMS on share (default sender on Basic; custom studio name on Pro+)",
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
    eyebrow: "Brand, analytics & AI",
    headline: "Watermarks, insights, and smarter picks",
    outcome: "Protect work. Understand engagement. Scale selection.",
    description:
      "Text watermarks from day one. Pro adds a logo on downloads, advanced analytics, and trash restore. Premium adds Gallery AI — generate or improve gallery descriptions in the studio, and let clients run AI smart picks on the share link.",
    bullets: [
      "Text watermarks on previews; logo watermark on downloads (Pro+)",
      "Analytics dashboard — opens, picks, selection rate",
      "Advanced analytics — 7-day activity chart and download counts (Pro+)",
      "Trash restore for soft-deleted galleries and photos (Pro+)",
      "Gallery AI — studio descriptions plus client AI suggestions (Premium)",
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
  {
    id: "team-collab",
    section: "studio",
    eyebrow: "Premium · Team",
    headline: "Invite photographers and share the shoot",
    outcome: "Second shooters and editors on one workspace",
    description:
      "Team collaboration is for working with other photographers on Gidtransfer — not client delivery. Create a shoot workspace, invite them by email, and upload images among yourselves. Uploads stay separate from client galleries. Studio team is different: create assistant logins on your account with roles and menu access (up to 10).",
    bullets: [
      "Create a collaboration workspace named for the shoot",
      "Invite other Gidtransfer photographers by email",
      "Share uploads in one place — client galleries stay separate",
      "Studio team — assistants with roles and menus (up to 10)",
      "Premium support on the top studio plan (GH₵ 120/mo or GH₵ 1,300/yr)",
    ],
    surface: "dashboard",
    visual: {
      type: "photo",
      src: "/images/gallery-form.png",
      alt: "Photographers collaborating on a shared shoot workspace",
    },
  },
] as const;

export const featureSurfaceLabels: Record<FeatureSurface, string> = {
  client: "Client gallery link",
  dashboard: "Your dashboard",
  both: "Client link & dashboard",
};
