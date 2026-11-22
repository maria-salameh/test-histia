import { redirect } from "next/navigation";
import type { NextPageIntlayer } from "next-intlayer";

// /fr and /en have no content of their own: the entry point of the app is the login page.
const HomePage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params;
  redirect(`/${locale}/login`);
};

export default HomePage;
