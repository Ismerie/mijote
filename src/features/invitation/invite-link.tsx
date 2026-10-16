"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { createInvitation } from "./actions";

// Crée un lien d'invitation, puis propose de le partager (menu du téléphone) ou de le copier (#8).
export function InviteLink() {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  // navigator.share n'existe que sur certains navigateurs (téléphones surtout).
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  function handleCreate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await createInvitation();
      if ("error" in result) {
        setError(result.error);
      } else {
        setLink(`${window.location.origin}/invitation/${result.code}`);
      }
    });
  }

  async function handleShare() {
    if (!link) return;
    try {
      await navigator.share({ title: "Mijote", text: "Rejoins notre foyer sur Mijote :", url: link });
    } catch {
      // Partage annulé par l'utilisatrice : rien à faire.
    }
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Presse-papiers refusé par le navigateur : le lien reste sélectionnable à la main.
      setError("Copie impossible : sélectionne le lien et copie-le à la main.");
    }
  }

  if (!link) {
    return (
      <div className="flex w-full flex-col gap-3">
        <Button onClick={handleCreate} disabled={pending} className="h-11 bg-[#C2552D] text-white hover:bg-[#A8461F]">
          {pending ? "Création…" : "Créer un lien d'invitation"}
        </Button>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="break-all rounded-lg border border-[#7A3219]/20 bg-white px-3 py-2 text-sm select-all">{link}</p>
      <div className="flex gap-2">
        {canShare && (
          <Button onClick={handleShare} className="h-11 flex-1 bg-[#C2552D] text-white hover:bg-[#A8461F]">
            Partager
          </Button>
        )}
        <Button onClick={handleCopy} variant="outline" className="h-11 flex-1">
          {copied ? "Copié ✓" : "Copier le lien"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <p className="text-sm text-[#7A3219]/70">Valable 7 jours, pour une seule personne.</p>
      <Button onClick={handleCreate} variant="link" disabled={pending} className="text-[#7A3219]">
        Créer un autre lien
      </Button>
    </div>
  );
}
