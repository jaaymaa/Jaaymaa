import { redirect } from "next/navigation";
import { getCurrentSellerContextStrict, getSessionToken } from "@/lib/auth";
import ConnexionForm from "./ConnexionForm";

export default async function ConnexionPage() {
  const [sellerContext, token] = await Promise.all([
    getCurrentSellerContextStrict(),
    getSessionToken(),
  ]);

  if (sellerContext) redirect("/espace");

  return <ConnexionForm sessionNotice={Boolean(token)} />;
}
