import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  listCommunityPosts,
  createCommunityPost,
  toggleFlame,
} from "@/lib/elevate.functions";

const MAX_CHARS = 280;
const MIN_CHARS = 10;

const REJECTION_MESSAGES = [
  "Your coach read that. Try again with something you'd be proud of. 🙏",
  "This community is for growth, not chaos. Rewrite it.",
  "That one stays in the drafts. Write something worth sharing.",
  "The community deserves your real thoughts. Try again.",
];

function timeAgo(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function CommunityBoard({
  slug,
  currentDayNumber,
  composerOpen,
  onComposerClose,
}: {
  slug: string;
  currentDayNumber: number;
  composerOpen: boolean;
  onComposerClose: () => void;
}) {
  const qc = useQueryClient();
  const listFn = useServerFn(listCommunityPosts);
  const createFn = useServerFn(createCommunityPost);
  const flameFn = useServerFn(toggleFlame);

  const [isComposing, setIsComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [rejection, setRejection] = useState<string | null>(null);

  // Header button opens the composer
  useEffect(() => {
    if (composerOpen) setIsComposing(true);
  }, [composerOpen]);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["community-posts", slug],
    queryFn: () => listFn({ data: { trackSlug: slug } }),
  });

  const createPost = useMutation({
    mutationFn: () => createFn({ data: { trackSlug: slug, content: draft.trim() } }),
    onSuccess: (res: any) => {
      if (res.approved) {
        setDraft("");
        setRejection(null);
        setIsComposing(false);
        onComposerClose();
        qc.invalidateQueries({ queryKey: ["community-posts", slug] });
      } else {
        setRejection(
          res?.reason === "Community temporarily unavailable"
            ? "Community temporarily unavailable. Please try again in a moment."
            : REJECTION_MESSAGES[Math.floor(Math.random() * REJECTION_MESSAGES.length)]
        );
      }
    },
    onError: () => setRejection("Something went wrong. Try again."),
  });

  const flame = useMutation({
    mutationFn: (postId: string) => flameFn({ data: { postId } }),
    onMutate: async (postId: string) => {
      await qc.cancelQueries({ queryKey: ["community-posts", slug] });
      const prev = qc.getQueryData(["community-posts", slug]);
      qc.setQueryData(["community-posts", slug], (old: any) =>
        (old ?? []).map((p: any) =>
          p.id === postId
            ? {
                ...p,
                user_has_flamed: !p.user_has_flamed,
                flame_count: p.flame_count + (p.user_has_flamed ? -1 : 1),
              }
            : p
        )
      );
      return { prev };
    },
    onError: (_err: any, _id: any, ctx: any) => {
      qc.setQueryData(["community-posts", slug], ctx?.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["community-posts", slug] }),
  });

  const closeComposer = () => {
    setIsComposing(false);
    setDraft("");
    setRejection(null);
    onComposerClose();
  };

  return (
    <section className="mt-6 depth-card rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] uppercase tracking-[0.3em] font-mono text-muted-foreground">
          Community
        </h2>
        {!isComposing && (
          <button
            onClick={() => setIsComposing(true)}
            className="btn-chunk rounded-full bg-foreground text-background px-3.5 py-1.5 text-xs font-semibold"
          >
            Share ↗
          </button>
        )}
      </div>

      {/* Post composer */}
      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
                  Day {currentDayNumber}
                </span>
                <button
                  onClick={closeComposer}
                  aria-label="Close composer"
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value.slice(0, MAX_CHARS));
                  setRejection(null);
                }}
                placeholder="Share a reflection about your journey…"
                className="w-full bg-transparent text-sm outline-none resize-none min-h-[80px] placeholder:text-muted-foreground leading-relaxed"
                autoFocus
              />

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span
                  className={`text-[11px] font-mono tabular-nums ${
                    draft.length >= MAX_CHARS
                      ? "text-[color:var(--secondary)]"
                      : "text-muted-foreground"
                  }`}
                >
                  {MAX_CHARS - draft.length}
                </span>
                <button
                  onClick={() => {
                    if (draft.trim().length >= MIN_CHARS) createPost.mutate();
                  }}
                  disabled={draft.trim().length < MIN_CHARS || createPost.isPending}
                  className="btn-chunk rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-1.5 transition"
                >
                  <Send className="h-3 w-3" />
                  {createPost.isPending ? "Checking…" : "Post"}
                </button>
              </div>

              {rejection && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm font-medium text-[color:var(--secondary)] shake"
                >
                  {rejection}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-muted animate-pulse h-20" />
          ))}
        </div>
      ) : (posts ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Be the first to share something on this path.
        </p>
      ) : (
        <div className="space-y-3">
          {(posts ?? []).map((post: any) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card border border-border p-4"
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                  Day {post.day_number}
                </span>
                <p className="flex-1 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {post.content}
                </p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => flame.mutate(post.id)}
                  className={`btn-chunk inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    post.user_has_flamed
                      ? "bg-[color:var(--secondary)]/15 text-[color:var(--secondary)]"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={post.user_has_flamed ? "Remove flame" : "Add flame"}
                >
                  <Flame
                    className={`h-3.5 w-3.5 ${post.user_has_flamed ? "flame" : ""}`}
                  />
                  <span className="num">{post.flame_count}</span>
                </button>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {timeAgo(post.created_at)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
