import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, Star, Swords } from "lucide-react";
import { bossRoundKey, getModule, placementSkipCount } from "@/lib/modules";
import Mascot from "@/components/Mascot";
import { cn } from "@/lib/utils";

/**
 * Staggered vertical path of case nodes, strictly sequential: a case stays
 * locked until the one directly above it in the list is completed. Every
 * BOSS_INTERVAL-th real case closes out a "level" with a boss-round gate —
 * an OSCE checkpoint bundling cases from that stretch — which itself must
 * be cleared before anything past it unlocks, same as a regular case
 * would. Boss rounds are free for everyone (unlike the standalone /osce
 * page's Premium gate): they block core tree progression, not just deeper
 * analysis, so they can't be paywalled without contradicting "practicing
 * cases is always free."
 *
 * When called with cases from multiple modules at once (as Home does,
 * showing every module in one path), the chain still runs top to bottom
 * across all of them rather than per-module, so the lock state always
 * matches what's visually above/below a given node. A boss round in that
 * context pulls its cases from whichever module the 10th case in that
 * stretch belongs to.
 */
// Demo padding: modules with only a couple of real cases still show a full
// path of locked nodes below them, so every module looks like it has a
// depth of content coming rather than visibly running out after one case.
// Purely cosmetic — these have no case behind them and never unlock.
const DEMO_MIN_NODES = 8;
const BOSS_INTERVAL = 10;

function FlexWaypoint() {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <Mascot mood="cheerful" className="h-20 w-20" />
      <div className="h-2.5 w-14 rounded-full bg-foreground/15 blur-[2px]" />
    </div>
  );
}

function BossNode({ locked, done, onOpen }) {
  return (
    <button
      disabled={locked}
      onClick={onOpen}
      title="Boss Round"
      className={cn(
        "relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 transition-transform active:translate-y-1",
        done && "bg-amber-100 border-amber-500 border-b-[6px] text-amber-700",
        locked && "bg-muted border-border text-muted-foreground cursor-not-allowed",
        !done && !locked && "bg-gradient-to-br from-rose-500 to-orange-500 border-rose-600 border-b-[6px] text-white"
      )}
    >
      {locked ? <Lock className="h-6 w-6" /> : done ? <Check className="h-7 w-7" /> : <Swords className="h-7 w-7" />}
      <span className="absolute -bottom-5 whitespace-nowrap text-[10px] font-bold text-muted-foreground">Boss round</span>
    </button>
  );
}

export default function CasePath({ cases, progressByCaseId, bossRoundsCompleted, onOpen, experienceLevel, groupBy = "module" }) {
  const navigate = useNavigate();
  const sorted = [...cases].sort((a, b) => (a.order || 0) - (b.order || 0));
  const placeholderCount = Math.max(0, DEMO_MIN_NODES - sorted.length);
  const skipCount = placementSkipCount(sorted, experienceLevel);
  let unlocked = true;
  // Flex stands once, right at the boundary between what's unlocked and
  // what's still locked — the natural "you are here, keep going" spot.
  let flexPlaced = false;

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {sorted.flatMap((c, i) => {
        const progress = progressByCaseId?.[c.id];
        const done = progress?.status === "completed";
        const inProgress = progress?.status === "in_progress";
        // Placement-skipped nodes are always playable without needing the
        // chain above them completed — but they don't count as "done", so
        // they don't falsely advance accuracy/progress stats.
        const inSkipZone = i < skipCount;
        const locked = inSkipZone ? false : !unlocked;
        const showFlex = locked && !flexPlaced;
        if (showFlex) flexPlaced = true;
        if (!inSkipZone && !done) unlocked = false;
        // Same icon the module uses everywhere else (dropdown, nav, header)
        // rather than an arbitrary cycling set unrelated to the category.
        const NodeIcon = getModule(c.module)?.icon || Star;

        const items = [
          showFlex && <FlexWaypoint key={`flex-${c.id}`} />,
          <button
            key={c.id}
            disabled={locked}
            onClick={() => onOpen(c.id)}
            title={c.title}
            className={cn(
              "relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-transform active:translate-y-1",
              i % 2 === 0 ? "-translate-x-6" : "translate-x-6",
              done && "bg-emerald-100 border-emerald-500 border-b-[6px] text-emerald-700",
              inProgress && "bg-amber-100 border-amber-500 border-b-[6px] text-amber-700",
              locked && "bg-muted border-border text-muted-foreground cursor-not-allowed",
              !done && !inProgress && !locked && "bg-primary/10 border-primary border-b-[6px] text-primary"
            )}
          >
            {locked ? (
              <Lock className="h-5 w-5" />
            ) : done ? (
              <Check className="h-6 w-6" />
            ) : (
              <NodeIcon className="h-6 w-6" />
            )}
            {done && progress?.accuracy >= 90 && (
              <Star className="absolute -top-2 -right-1 h-5 w-5 fill-amber-400 text-amber-500" />
            )}
          </button>,
        ];

        if ((i + 1) % BOSS_INTERVAL === 0) {
          const bossLevel = Math.floor(i / BOSS_INTERVAL);
          const groupId = groupBy === "region" ? c.body_region : c.module;
          const bossKey = bossRoundKey(groupBy, groupId, bossLevel);
          const bossDone = !!bossRoundsCompleted?.[bossKey];
          const bossLocked = !unlocked;
          if (!bossDone) unlocked = false;
          const axisParam = groupBy === "region" ? "region" : "module";
          items.push(
            <BossNode
              key={`boss-${bossKey}`}
              locked={bossLocked}
              done={bossDone}
              onOpen={() => navigate(`/osce?${axisParam}=${groupId}&bossLevel=${bossLevel}`)}
            />
          );
        }

        return items;
      })}
      {Array.from({ length: placeholderCount }).map((_, j) => {
        const i = sorted.length + j;
        const showFlex = !flexPlaced;
        if (showFlex) flexPlaced = true;
        return (
          <Fragment key={`placeholder-${j}`}>
            {showFlex && <FlexWaypoint />}
            <div
              title="Coming soon"
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted text-muted-foreground",
                i % 2 === 0 ? "-translate-x-6" : "translate-x-6"
              )}
            >
              <Lock className="h-5 w-5" />
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
