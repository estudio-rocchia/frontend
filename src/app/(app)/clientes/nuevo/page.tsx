import { redirect } from "next/navigation";

export default function NuevoClientePage() {
  redirect("/clientes?crear=1");
}
