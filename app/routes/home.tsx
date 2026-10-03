import { redirect } from "react-router";

export function loader() {
  return redirect("/agent");
}

export default function Home() {
  return null;
}
