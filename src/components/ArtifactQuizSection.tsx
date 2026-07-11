import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  HelpCircle,
  Sparkles,
  XCircle,
  TrendingUp,
  Award,
} from "lucide-react";
import { buildArtifactQuiz, type ArtifactQuizArtifact } from "@/lib/artifact-quizzes";
import { useI18n } from "@/lib/i18n";
import { scanArtifact, type ScanResult } from "@/lib/museum.functions";
import { sfx } from "@/lib/sfx";

interface Props {
  artifact: ArtifactQuizArtifact;
  alreadyCompleted: boolean;
  completion: ScanResult | null;
  onCompleted?: (result: ScanResult) => void;
}

export function ArtifactQuizSection({ artifact, alreadyCompleted, completion, onCompleted }: Props) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const submitQuiz = useServerFn(scanArtifact);
  const questions = useMemo(() => buildArtifactQuiz(artifact), [artifact]);

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [localCompletion, setLocalCompletion] = useState<ScanResult | null>(null);
  const [lockedByServer, setLockedByServer] = useState(alreadyCompleted);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const finalCompletion = completion ?? localCompletion;
  const currentQuestion = questions[currentIndex];
  const isLocked = lockedByServer || alreadyCompleted;
  const correctCount = [...answers, ...(selectedIndex === null ? [] : [selectedIndex])].reduce(
    (total, answer, index) => total + (answer === questions[index].correctIndex ? 1 : 0),
    0,
  );

  function handleLockedClick() {
    sfx.error();
  }

  function handleAnswer(index: number) {
    if (selectedIndex !== null || submitting) return;
    setSelectedIndex(index);
    if (index === currentQuestion.correctIndex) sfx.success();
    else sfx.error();
  }

  async function handleNext() {
    if (selectedIndex === null) return;

    const nextAnswers = [...answers, selectedIndex];
    const isLast = currentIndex === questions.length - 1;

    if (!isLast) {
      setAnswers(nextAnswers);
      setCurrentIndex((value) => value + 1);
      setSelectedIndex(null);
      setSubmitError(null);
      return;
    }

    const finalCorrectCount = nextAnswers.reduce(
      (total, answer, index) => total + (answer === questions[index].correctIndex ? 1 : 0),
      0,
    );

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = (await submitQuiz({
        data: {
          artifactId: artifact.id,
          correctCount: finalCorrectCount,
        },
      })) as ScanResult;

      if (finalCorrectCount === questions.length) {
        sfx.fanfare();
      } else {
        sfx.success();
      }

      await qc.invalidateQueries();

      if (result.alreadyScanned && result.quizCorrectCount === null) {
        // This shouldn't happen with the new server logic but safety first
        setLockedByServer(true);
        sfx.error();
      } else {
        setLocalCompletion(result);
        onCompleted?.(result);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("quiz_submit_error"));
      sfx.error();
    } finally {
      setSubmitting(false);
    }
  }

  if (finalCompletion || lockedByServer) {
    const score = finalCompletion?.quizCorrectCount ?? completion?.quizCorrectCount ?? 0;
    const total = finalCompletion?.quizTotalQuestions ?? completion?.quizTotalQuestions ?? 3;
    const isPerfect = score === total;

    return (
      <section className="animate-in zoom-in-95 rounded-[24px] border-2 border-primary/20 bg-gradient-to-b from-card to-accent/20 p-6 shadow-xl duration-500">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className={`absolute inset-0 animate-ping rounded-full opacity-20 ${isPerfect ? "bg-gold" : "bg-primary"}`} />
            <div className={`relative flex size-20 items-center justify-center rounded-full shadow-lg ${isPerfect ? "bg-gold text-white" : "bg-primary text-primary-foreground"}`}>
              {isPerfect ? <Sparkles className="size-10" /> : <CheckCircle2 className="size-10" />}
            </div>
          </div>
          <h3 className="font-display text-2xl text-ink">
            {isPerfect ? "Luar Biasa!" : t("quiz_result_title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isPerfect ? "Anda pakar warisan!" : "Bagus! Teruskan belajar."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("quiz_score")}</p>
            <p className="font-display text-3xl text-ink">
              {score}<span className="text-muted-foreground/40">/{total}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("exp_gained")}</p>
            <p className="font-display text-3xl text-primary">+{finalCompletion.expGained}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {finalCompletion.levelUps > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-gold/10 p-3 text-sm font-medium text-amber-700">
              <TrendingUp className="size-5" />
              <span>{t("level_up")} → Lv. {finalCompletion.level}</span>
            </div>
          )}
          {finalCompletion.newBadges.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-3 text-sm font-medium text-primary">
              <Award className="size-5" />
              <span>{t("new_badge")} Diperoleh!</span>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="animate-in slide-in-from-right-4 h-full rounded-[24px] border-2 border-border bg-card/60 p-6 shadow-sm duration-300">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
          <HelpCircle className="size-4" />
          {t("quiz_title")}
        </div>
        <div className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold text-muted-foreground">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="mb-8 min-h-[4.5rem]">
        <p className="text-lg font-semibold leading-snug text-ink">
          {lang === "bm" ? currentQuestion.prompt.bm : currentQuestion.prompt.en}
        </p>
      </div>

      <div className="space-y-3">
        {currentQuestion.options.map((option, index) => {
          const isCorrect = index === currentQuestion.correctIndex;
          const isSelected = index === selectedIndex;
          const showState = selectedIndex !== null;
          const stateClass = showState
            ? isCorrect
              ? "border-jungle bg-jungle/10 text-jungle ring-2 ring-jungle/20"
              : isSelected
                ? "border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/20"
                : "border-border bg-card/40 text-muted-foreground opacity-60"
            : "border-border bg-card hover:border-primary hover:bg-primary/5 hover:shadow-md";

          return (
            <button
              key={index}
              type="button"
              disabled={selectedIndex !== null || submitting}
              onClick={() => handleAnswer(index)}
              className={`flex w-full items-center justify-between rounded-2xl border-2 px-5 py-4 text-left text-sm font-medium transition-all duration-200 ${stateClass} disabled:cursor-default`}
            >
              <span>{lang === "bm" ? option.bm : option.en}</span>
              {showState && isCorrect && <CheckCircle2 className="size-5 shrink-0 text-jungle" />}
              {showState && isSelected && !isCorrect && <XCircle className="size-5 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>

      {selectedIndex !== null && (
        <div className="mt-8 flex animate-in fade-in slide-in-from-bottom-2 flex-col gap-4 duration-300">
          <div className="flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full bg-muted overflow-hidden`}>
              <div 
                className={`h-full transition-all duration-500 ${selectedIndex === currentQuestion.correctIndex ? "bg-jungle" : "bg-destructive"}`}
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-4 font-bold text-white shadow-lg transition-all hover:bg-ink/90 active:scale-95 disabled:opacity-60"
          >
            {submitting
              ? "..."
              : currentIndex === questions.length - 1
                ? t("quiz_finish")
                : t("quiz_next")}
          </button>
        </div>
      )}

      {submitError && <p className="mt-4 text-center text-xs font-medium text-destructive">{submitError}</p>}
    </section>
  );
}
