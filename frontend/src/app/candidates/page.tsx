"use client";

import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { Candidate } from "@/types";
import {
  Eye,
  FileText,
  FileArrowUp,
  Envelope,
  Phone,
  Sparkle,
  Trash,
  Upload,
  UserCircle,
} from "@phosphor-icons/react";

function formatUploadedDate(value?: string) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateDraft, setCandidateDraft] = useState({ name: "", email: "", phone: "" });
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const loadCandidates = async () => {
    try {
      const data = await api.getCandidates();
      setCandidates(data);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const handleUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (file) => file.name.endsWith(".pdf") || file.name.endsWith(".docx")
    );

    if (validFiles.length === 0) {
      alert("Please upload PDF or DOCX files only");
      return;
    }

    setUploading(true);
    try {
      await api.uploadCVs(validFiles);
      loadCandidates();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    try {
      await api.deleteCandidate(id);
      loadCandidates();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const openCandidateDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCandidateDraft({
      name: candidate.name || "",
      email: candidate.email || "",
      phone: candidate.phone || "",
    });
  };

  const handleSaveCandidate = async () => {
    if (!selectedCandidate) return;

    setSavingCandidate(true);
    try {
      const updated = await api.updateCandidate(selectedCandidate.id, candidateDraft);
      setCandidates((current) =>
        current.map((candidate) => (candidate.id === updated.id ? updated : candidate))
      );
      setSelectedCandidate(updated);
      setCandidateDraft({
        name: updated.name || "",
        email: updated.email || "",
        phone: updated.phone || "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setSavingCandidate(false);
    }
  };

  const handleDragState = (active: boolean) => (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(active);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleUpload(event.dataTransfer.files);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="page-shell space-y-12 sm:space-y-16">
      <motion.section variants={itemVariants} className="glass-panel relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative grid gap-10 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1 text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
              <Sparkle className="h-3.5 w-3.5 text-foreground" weight="fill" />
              Candidate inbox
            </div>

            <div>
              <h1 className="max-w-4xl font-heading text-4xl tracking-tighter text-foreground sm:text-5xl md:text-6xl leading-[1.1]">
                A lighter inbox for collecting CVs, checking parse quality, and keeping inbound talent organized.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
                The visual structure is simpler now: one upload zone, clear volume stats, and candidate cards that are easier to scan than a dense table.
              </p>
            </div>

            <div
              onDragEnter={handleDragState(true)}
              onDragLeave={handleDragState(false)}
              onDragOver={handleDragState(true)}
              onDrop={handleDrop}
              className={`rounded-[2.5rem] border-2 border-dashed p-10 transition-all duration-300 backdrop-blur-xl ${
                dragActive
                  ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(14,165,233,0.3)] scale-[1.02]"
                  : "border-white/60 bg-white/50 hover:bg-white/70 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
              }`}
            >
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-sky-500/20">
                    <FileArrowUp className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-heading text-xl font-semibold text-foreground">Upload candidate CVs</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Drag PDF or DOCX files here, or browse manually. The parser will store raw text so the screening engine can reuse it later.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/50 bg-white/50 p-5 shadow-sm">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Profiles</p>
                      <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{loading ? 0 : candidates.length}</p>
                    </div>
                    <div className="rounded-xl border border-white/50 bg-white/50 p-5 shadow-sm">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Formats</p>
                      <p className="mt-2 font-heading text-3xl font-semibold text-foreground">PDF</p>
                    </div>
                    <div className="rounded-xl border border-white/50 bg-white/50 p-5 shadow-sm">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Fallback</p>
                      <p className="mt-2 font-heading text-3xl font-semibold text-foreground">DOCX</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <label className="w-full sm:w-auto">
                      <input
                        id="cv-upload"
                        type="file"
                        multiple
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={(event) => event.target.files && handleUpload(event.target.files)}
                      />
                      <button
                        disabled={uploading}
                        className="premium-button flex h-12 w-full items-center justify-center px-8 text-sm font-medium sm:w-auto"
                        onClick={() => document.getElementById("cv-upload")?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading..." : "Select files"}
                      </button>
                    </label>
                    <div className="inline-flex w-full items-center rounded-xl border border-white/50 bg-white/40 px-5 py-3 text-sm text-muted-foreground shadow-sm sm:w-auto">
                      Supports PDF and DOCX. Use cleaner CVs for better parsing quality.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/50 bg-white/40 p-8 shadow-sm backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Inbox posture</p>
              <p className="mt-4 font-heading text-6xl font-semibold text-foreground">{loading ? 0 : candidates.length}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Candidate profiles already stored and ready for selection in the screening workspace.
              </p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/40 p-8 shadow-sm backdrop-blur-xl">
              <p className="font-heading text-xl font-semibold text-foreground">Upload guidance</p>
              <div className="mt-5 space-y-3">
                {[
                  "Use one CV file per candidate to keep profiles clean.",
                  "Prefer PDFs with selectable text for stronger parsing output.",
                  "Open the parsed preview after upload if the profile looks incomplete.",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-white/60 bg-white/50 px-5 py-4 text-sm text-foreground shadow-sm hover:bg-white transition-all">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {loading ? (
        <div className="py-24 text-center text-muted-foreground font-mono text-sm">Loading candidates...</div>
      ) : candidates.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-panel py-24 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/50 shadow-sm border border-white/60">
            <UserCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No candidates yet. Upload CVs to start building the pipeline.</p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-3xl font-semibold text-foreground">Candidate list</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tap into each profile to inspect the parsed CV content before screening.</p>
            </div>
            <Badge className="badge-pale-blue rounded-md border-0 font-mono">
              {candidates.length} total
            </Badge>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <AnimatePresence>
              {candidates.map((candidate) => (
                <motion.div layout layoutId={`candidate-${candidate.id}`} variants={itemVariants} key={candidate.id} className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl hover:scale-[1.02] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out group">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-md transition-transform group-hover:scale-110">
                        {candidate.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-xl font-semibold text-foreground">
                        {candidate.name || "Unnamed candidate"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground mt-1">{candidate.email || "No email detected"}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => openCandidateDetails(candidate)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/50 text-muted-foreground shadow-sm transition hover:bg-white hover:text-primary hover:shadow-md hover:-translate-y-1"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(candidate.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/50 text-muted-foreground shadow-sm transition hover:bg-white hover:text-destructive hover:shadow-md hover:-translate-y-1"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-white/50 bg-white/40 px-5 py-4 shadow-sm">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Email</p>
                    <p className="mt-2 truncate text-sm font-medium text-foreground">{candidate.email || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border border-white/50 bg-white/40 px-5 py-4 shadow-sm">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Phone</p>
                    <p className="mt-2 truncate text-sm font-medium text-foreground">{candidate.phone || "N/A"}</p>
                  </div>
                  <div className="rounded-xl border border-white/50 bg-white/40 px-5 py-4 shadow-sm">
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">Uploaded</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {formatUploadedDate(candidate.uploaded_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge className="badge-pale-green rounded-md border-0 uppercase font-mono text-[10px]">CV parsed</Badge>
                  <Badge className="badge-pale-yellow rounded-md border-0 uppercase font-mono text-[10px]">
                    {candidate.parsed_data?.sections?.length || 0} sections detected
                  </Badge>
                </div>

                <div className="mt-6 rounded-xl border border-white/50 bg-white/40 p-6 shadow-sm">
                  <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                    <FileText className="h-3.5 w-3.5" />
                    Preview
                  </p>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                    {candidate.parsed_data?.raw_text || "No parsed content available yet."}
                  </p>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto rounded-[2.5rem] border border-white/60 bg-white/90 p-0 shadow-2xl backdrop-blur-3xl sm:max-h-[90vh] sm:max-w-4xl">
          <DialogHeader className="border-b border-white/40 bg-gradient-to-br from-white/80 to-white/40 px-8 py-10 backdrop-blur-md">
            <DialogTitle className="flex items-center gap-6 text-foreground font-heading text-4xl">
              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg font-sans text-3xl font-bold">
                {selectedCandidate?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex flex-col items-start gap-2">
                <span>{selectedCandidate?.name || "Candidate details"}</span>
                <Badge className="badge-pale-blue rounded-md border-0 font-mono text-sm uppercase px-3 py-1">Profile View</Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedCandidate ? (
            <div className="space-y-8 p-6 sm:p-8">
              <div className="rounded-2xl border border-white/50 bg-white/60 p-8 shadow-sm">
                <div className="flex items-start gap-4">
                  <UserCircle className="mt-1 h-6 w-6 text-primary" />
                  <div>
                    <p className="font-heading text-xl font-semibold text-foreground">Parsed identity</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Parser output is editable because CV layouts can mix names, locations, links, and contact lines.
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Name</Label>
                    <Input
                      value={candidateDraft.name}
                      onChange={(event) => setCandidateDraft((current) => ({ ...current, name: event.target.value }))}
                      className="h-12 rounded-xl border-white/50 bg-white/50 shadow-sm focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
                      <Envelope className="h-3.5 w-3.5" />
                      Email
                    </Label>
                    <Input
                      value={candidateDraft.email}
                      onChange={(event) => setCandidateDraft((current) => ({ ...current, email: event.target.value }))}
                      className="h-12 rounded-xl border-white/50 bg-white/50 shadow-sm focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </Label>
                    <Input
                      value={candidateDraft.phone}
                      onChange={(event) => setCandidateDraft((current) => ({ ...current, phone: event.target.value }))}
                      className="h-12 rounded-xl border-white/50 bg-white/50 shadow-sm focus-visible:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSaveCandidate}
                    disabled={savingCandidate}
                    className="premium-button flex h-11 items-center justify-center px-8 text-sm font-medium shadow-sm"
                  >
                    {savingCandidate ? "Saving..." : "Save identity"}
                  </button>
                </div>
              </div>

              {selectedCandidate.parsed_data?.parse_confidence ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(selectedCandidate.parsed_data.parse_confidence).map(([field, confidence]) => (
                    <div key={field} className="rounded-2xl border border-white/50 bg-white/50 px-6 py-5 shadow-sm">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">{field}</p>
                      <p className="mt-2 font-heading text-2xl font-medium capitalize text-foreground">{String(confidence)}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div>
                <p className="flex items-center gap-3 font-heading text-xl font-semibold text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Parsed CV content
                </p>
                <div className="mt-5 rounded-2xl border border-white/50 bg-white/50 p-8 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground max-h-[32rem] overflow-y-auto font-mono shadow-inner">
                  {selectedCandidate.parsed_data?.raw_text || "No parsed content available."}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
