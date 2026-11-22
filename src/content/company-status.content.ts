import { type Dictionary, t } from "intlayer";

// Badges shown on a company card. CLOSED and INACTIVE share "closed", ACQUIRED shows "sold", ACTIVE has none.
const companyStatusContent = {
  key: "company-status",
  content: {
    closed: t({ fr: "Fermée", en: "Closed" }),
    sold: t({ fr: "Vendue", en: "Sold" }),
  },
} satisfies Dictionary;

export default companyStatusContent;
