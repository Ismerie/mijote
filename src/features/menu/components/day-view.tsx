"use client";

import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { placeMeal, setMealEaten } from "../actions";
import { groupMealsByDay, mealSubtitle, withMealEaten, type DayGroup, type MealItem, type Menu } from "../menu";
import { CarriedOverBadge, EatenBox } from "./state-boxes";

type Change = { kind: "place"; mealId: string; date: string | null } | { kind: "eaten"; mealId: string; eaten: boolean };

// Id d'un groupe pour le glisser-déposer : la date du jour, ou « a-placer ».
const UNPLACED = "a-placer";
const groupId = (group: DayGroup) => group.date ?? UNPLACED;

// Vue « Par jour » de l'accueil (#29) : « À placer » puis tous les jours du menu.
// Un repas se place en le glissant sur un jour (appui long au doigt), ou avec sa poignée ⋮⋮ puis « Placer ici ».
export function DayView({ menu, today }: { menu: Menu; today: string }) {
  const [optimistic, apply] = useOptimistic(menu, (current, change: Change) => ({
    ...current,
    dishes: current.dishes.map((dish) => {
      if (!dish.meals.some((meal) => meal.id === change.mealId)) return dish;
      if (change.kind === "eaten") return withMealEaten(dish, change.mealId, change.eaten, new Date().toISOString());
      return { ...dish, meals: dish.meals.map((meal) => (meal.id === change.mealId ? { ...meal, date: change.date } : meal)) };
    }),
  }));
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Le repas lâché reçoit aussi le clic de la souris ou du doigt : il ne doit pas ouvrir sa fiche.
  const justDropped = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Souris : le glisser commence après 8 px ; doigt : après un appui long, pour laisser défiler la page.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const groups = groupMealsByDay(optimistic, today);
  const meals = groups.flatMap((group) => group.meals);
  const moving = meals.find((meal) => meal.id === movingId);

  function place(meal: MealItem, date: string | null) {
    setMovingId(null);
    if (meal.date === date) return;
    setError(null);
    startTransition(async () => {
      apply({ kind: "place", mealId: meal.id, date });
      const result = await placeMeal(meal.id, date, meal.slot);
      if (result.error) setError(result.error);
    });
  }

  function toggleEaten(meal: MealItem) {
    setError(null);
    startTransition(async () => {
      apply({ kind: "eaten", mealId: meal.id, eaten: !meal.eaten });
      const result = await setMealEaten(meal.id, !meal.eaten);
      if (result.error) setError(result.error);
    });
  }

  function endDrag() {
    setDragging(false);
    justDropped.current = true;
    setTimeout(() => (justDropped.current = false), 0);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    endDrag();
    const meal = meals.find((item) => item.id === active.id);
    if (meal && over) place(meal, over.id === UNPLACED ? null : String(over.id));
  }

  const active = dragging || moving !== undefined;

  return (
    <DndContext sensors={sensors} onDragStart={() => setDragging(true)} onDragCancel={endDrag} onDragEnd={onDragEnd}>
      <div
        className="flex flex-col gap-3"
        onClickCapture={(event) => {
          if (justDropped.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {moving ? (
          <div className="sticky top-2 z-10 flex items-center gap-3 rounded-xl bg-primary-hover px-4 py-2.5 text-primary-foreground shadow-md">
            <p className="flex-1 font-semibold">Où placer « {moving.name} » ?</p>
            <Button type="button" variant="outline" onClick={() => setMovingId(null)} className="h-10 rounded-lg text-foreground">
              Annuler
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Glisse un repas sur un jour, ou touche ses poignées puis le jour voulu.</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {groups
          // « À placer » ne s'affiche que s'il contient des repas, ou pendant un déplacement.
          .filter((group) => group.date !== null || group.meals.length > 0 || active)
          .map((group) => (
            <DayGroupSection
              key={groupId(group)}
              group={group}
              active={active}
              canPlace={moving !== undefined}
              onPlaceHere={() => moving && place(moving, group.date)}
            >
              {group.meals.map((meal) => (
                <MealRow
                  key={meal.id}
                  meal={meal}
                  selected={meal.id === movingId}
                  onToggleEaten={() => toggleEaten(meal)}
                  onStartMove={() => setMovingId(meal.id)}
                />
              ))}
            </DayGroupSection>
          ))}
      </div>
    </DndContext>
  );
}

type GroupProps = {
  group: DayGroup;
  active: boolean;
  canPlace: boolean;
  onPlaceHere: () => void;
  children: React.ReactNode;
};

function DayGroupSection({ group, active, canPlace, onPlaceHere, children }: GroupProps) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId(group) });

  return (
    <section
      ref={setNodeRef}
      aria-label={group.label}
      className={cn(
        // Le contour ne prend pas de place : rien ne bouge quand un déplacement commence.
        "flex flex-col gap-2 rounded-xl outline-offset-4 transition-colors",
        active && "bg-primary/5 outline-2 outline-primary/40 outline-dashed",
        isOver && "bg-primary/10 outline-primary",
      )}
    >
      <div className="flex min-h-9 items-center justify-between gap-2 px-1">
        <h2
          className={cn(
            "text-xs font-semibold tracking-wider uppercase",
            group.isToday ? "text-primary" : "text-muted-foreground",
          )}
        >
          {group.label}
        </h2>
        {canPlace && (
          <Button type="button" onClick={onPlaceHere} className="h-9 rounded-lg px-3">
            Placer ici
          </Button>
        )}
      </div>
      {children}
      {group.date !== null && group.meals.length === 0 && (
        <p className="px-1 pb-1 text-sm text-muted-foreground/80">Rien de prévu</p>
      )}
    </section>
  );
}

type RowProps = {
  meal: MealItem;
  selected: boolean;
  onToggleEaten: () => void;
  onStartMove: () => void;
};

function MealRow({ meal, selected, onToggleEaten, onStartMove }: RowProps) {
  const { setNodeRef, listeners, transform, isDragging } = useDraggable({ id: meal.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        // Pas de menu « copier le lien » à l'appui long : l'appui long sert à glisser.
        "flex min-h-14 touch-manipulation items-center rounded-xl border bg-card select-none [-webkit-touch-callout:none]",
        selected ? "border-primary" : "border-border",
        isDragging && "relative z-20 shadow-lg",
      )}
    >
      <button
        type="button"
        onClick={onToggleEaten}
        aria-label={`${meal.eaten ? "Marquer comme pas mangé" : "Marquer comme mangé"} : ${meal.name}`}
        className="flex size-12 shrink-0 items-center justify-center self-stretch"
      >
        <EatenBox eaten={meal.eaten} />
      </button>
      <Link href={`/menu/repas/${meal.id}`} draggable={false} className="flex min-w-0 flex-1 flex-col gap-0.5 py-2.5">
        <span className={cn("truncate font-semibold", meal.eaten && "text-muted-foreground line-through")}>{meal.name}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {mealSubtitle(meal)}
          {meal.toCook && (
            <span className="flex items-center gap-1 text-secondary-foreground">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-70" />à cuisiner
            </span>
          )}
          {meal.carriedLabel && <CarriedOverBadge label={meal.carriedLabel} />}
        </span>
      </Link>
      <button
        type="button"
        onClick={onStartMove}
        aria-label={`Déplacer : ${meal.name}`}
        aria-pressed={selected}
        className="flex size-11 shrink-0 cursor-grab items-center justify-center text-muted-foreground"
      >
        <GripVertical aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
