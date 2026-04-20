"use client";

import { useEffect, useState } from "react";
import type { DragEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  FileUp,
  Mail,
  Phone,
  Sparkles,
  Trash2,
  Upload,
  UserCircle,
} from "lucide-react";

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

  return (
    <div className="page-shell space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-sky-100/90 bg-white/90 shadow-[0_18px_52px_rgba(96,165,250,0.14)] sm:rounded-[2.25rem]">
        <div className="absolute inset-0 hero-mesh" />
        <div className="absolute inset-0 blueprint-grid opacity-50" />
        <div className="relative grid gap-6 p-4 sm:p-6 xl:grid-cols-[1.18fr_0.82fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Candidate inbox
            </div>

            <div>
              <h1 className="max-w-4xl text-2xl font-semibold text-slate-900 sm:text-3xl md:text-4xl">
                A lighter inbox for collecting CVs, checking parse quality, and keeping inbound talent organized.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                The visual structure is simpler now: one upload zone, clear volume stats, and candidate cards that are easier to scan than a dense table.
              </p>
            </div>

            <div
              onDragEnter={handleDragState(true)}
              onDragLeave={handleDragState(false)}
              onDragOver={handleDragState(true)}
              onDrop={handleDrop}
              className={`rounded-[1.85rem] border-2 border-dashed p-5 sm:p-7 transition-all duration-300 ${
                dragActive
                  ? "border-sky-400 bg-sky-50/80 shadow-lg shadow-sky-100"
                  : "border-sky-100 bg-white/86"
              }`}
            >
              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 shadow-lg shadow-sky-200">
                    <FileUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Upload candidate CVs</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      Drag PDF or DOCX files here, or browse manually. The parser will store raw text so the screening engine can reuse it later.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-sky-100 bg-white/92 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Profiles</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{loading ? 0 : candidates.length}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white/92 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Formats</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">PDF</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white/92 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fallback</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">DOCX</p>
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
                      <Button
                        disabled={uploading}
                        className="h-12 w-full rounded-2xl gradient-blue border-0 px-5 text-white shadow-lg shadow-sky-200 sm:w-auto"
                        onClick={() => document.getElementById("cv-upload")?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading..." : "Select files"}
                      </Button>
                    </label>
                    <div className="inline-flex w-full items-center rounded-2xl border border-sky-100 bg-white/88 px-4 py-3 text-sm text-slate-500 sm:w-auto">
                      Supports PDF and DOCX. Use cleaner CVs for better parsing quality.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="sky-card rounded-[1.75rem] border-0">
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Inbox posture</p>
                <p className="mt-2 text-4xl font-semibold text-slate-900">{loading ? 0 : candidates.length}</p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Candidate profiles already stored and ready for selection in the screening workspace.
                </p>
              </CardContent>
            </Card>

            <Card className="soft-panel rounded-[1.75rem] border-0">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-semibold text-slate-900">Upload guidance</p>
                <div className="mt-4 space-y-3">
                  {[
                    "Use one CV file per candidate to keep profiles clean.",
                    "Prefer PDFs with selectable text for stronger parsing output.",
                    "Open the parsed preview after upload if the profile looks incomplete.",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-sky-100 bg-white/88 px-4 py-3 text-sm text-slate-600">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading candidates...</div>
      ) : candidates.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <UserCircle className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">No candidates yet. Upload CVs to start building the pipeline.</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Candidate list</h2>
              <p className="text-sm text-slate-500">Tap into each profile to inspect the parsed CV content before screening.</p>
            </div>
            <Badge className="rounded-full border-0 bg-sky-50 px-3 py-1.5 text-sky-700">
              {candidates.length} total
            </Badge>
          </div>

          <div className="mt-4 grid gap-5 xl:grid-cols-2">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="soft-panel rounded-[1.75rem] border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 text-sm font-bold text-white shadow-lg shadow-sky-200">
                        {candidate.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-slate-900">
                          {candidate.name || "Unnamed candidate"}
                        </p>
                        <p className="truncate text-sm text-slate-500">{candidate.email || "No email detected"}</p>
                      </div>
                    </div>

                    <div className="flex gap-1 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCandidateDetails(candidate)}
                        className="h-9 w-9 rounded-xl p-0 hover:bg-sky-100 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(candidate.id)}
                        className="h-9 w-9 rounded-xl p-0 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-sky-100 bg-white/88 px-4 py-3">
                      <p className="text-xs text-slate-400">Email</p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-700">{candidate.email || "N/A"}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white/88 px-4 py-3">
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-700">{candidate.phone || "N/A"}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white/88 px-4 py-3">
                      <p className="text-xs text-slate-400">Uploaded</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatUploadedDate(candidate.uploaded_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="rounded-full border-0 bg-sky-50 text-sky-700">CV parsed</Badge>
                    <Badge className="rounded-full border-0 bg-white text-slate-700 ring-1 ring-sky-100">
                      {candidate.parsed_data?.sections?.length || 0} sections detected
                    </Badge>
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-sky-100 bg-white/88 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Preview</p>
                    <p className="mt-2 line-clamp-4 text-sm leading-7 text-slate-500">
                      {candidate.parsed_data?.raw_text || "No parsed content available yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-[1.75rem] border border-sky-100 bg-white p-0 sm:max-h-[88vh] sm:max-w-3xl">
          <DialogHeader className="border-b border-sky-100 bg-sky-50/60 px-4 py-4 sm:px-6 sm:py-5">
            <DialogTitle className="flex items-center gap-3 text-slate-900">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 text-sm font-bold text-white">
                {selectedCandidate?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              {selectedCandidate?.name || "Candidate details"}
            </DialogTitle>
          </DialogHeader>

          {selectedCandidate ? (
            <div className="space-y-5 p-4 sm:p-6">
              <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-4">
                <div className="flex items-start gap-3">
                  <UserCircle className="mt-1 h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Parsed identity</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Parser output is editable because CV layouts can mix names, locations, links, and contact lines.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={candidateDraft.name}
                      onChange={(event) => setCandidateDraft((current) => ({ ...current, name: event.target.value }))}
                      className="h-11 rounded-xl bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-blue-600" />
                      Email
                    </Label>
                    <Input
                      value={candidateDraft.email}
                      onChange={(event) => setCandidateDraft((current) => ({ ...current, email: event.target.value }))}
                      className="h-11 rounded-xl bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-blue-600" />
                      Phone
                    </Label>
                    <Input
                      value={candidateDraft.phone}
                      onChange={(event) => setCandidateDraft((current) => ({ ...current, phone: event.target.value }))}
                      className="h-11 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleSaveCandidate}
                    disabled={savingCandidate}
                    className="h-10 rounded-xl gradient-blue px-4 text-white shadow-md shadow-sky-200"
                  >
                    {savingCandidate ? "Saving..." : "Save identity"}
                  </Button>
                </div>
              </div>

              {selectedCandidate.parsed_data?.parse_confidence ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {Object.entries(selectedCandidate.parsed_data.parse_confidence).map(([field, confidence]) => (
                    <div key={field} className="rounded-2xl border border-sky-100 bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{field}</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-slate-700">{String(confidence)}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Parsed CV content
                </p>
                <div className="mt-3 rounded-[1.5rem] border border-sky-100 bg-slate-50 p-4 text-sm leading-7 whitespace-pre-wrap text-slate-600 max-h-[26rem] overflow-y-auto">
                  {selectedCandidate.parsed_data?.raw_text || "No parsed content available."}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
