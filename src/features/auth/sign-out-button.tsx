import { Button } from "@/components/ui/button";

import { signOut } from "./actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" className="h-11">
        Se déconnecter
      </Button>
    </form>
  );
}
