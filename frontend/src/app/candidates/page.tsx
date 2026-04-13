"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { Upload, Trash2, Eye, UserCircle, FileUp, Mail, Phone } from "lucide-react";
import type { Candidate } from "@/types";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const loadCandidates = async () => {
    try { const data = await api.getCandidates(); setCandidates(data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadCandidates(); }, []);

  const handleUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.name.endsWith(".pdf") || f.name.endsWith(".docx"));
    if (validFiles.length === 0) { alert("Please upload PDF or DOCX files only"); return; }
    setUploading(true);
    try { await api.uploadCVs(validFiles); loadCandidates(); } catch (err: any) { alert(err.message); } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    try { await api.deleteCandidate(id); loadCandidates(); } catch (err: any) { alert(err.message); }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-green">
          <UserCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Candidates</h1>
          <p className="text-slate-500 text-sm">Upload and manage candidate CVs</p>
        </div>
      </div>

      <div
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 mb-8 ${
          dragActive ? "border-indigo-400 bg-indigo-50/50 scale-[1.01]" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/20"
        }`}
      >
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-4 transition-colors ${dragActive ? "bg-indigo-100" : "bg-slate-100"}`}>
          <FileUp className={`h-8 w-8 ${dragActive ? "text-indigo-500" : "text-slate-400"}`} />
        </div>
        <p className="text-slate-600 font-medium mb-1">Drag & drop CV files here, or click to browse</p>
        <p className="text-sm text-slate-400 mb-4">Supports PDF and DOCX (max 10MB each)</p>
        <label>
          <input id="cv-upload" type="file" multiple accept=".pdf,.docx" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} />
          <Button disabled={uploading} className="gradient-blue border-0 text-white shadow-lg shadow-indigo-200 cursor-pointer" onClick={() => document.getElementById('cv-upload')?.click()}>
            {uploading ? "Uploading..." : "Select Files"}
          </Button>
        </label>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : candidates.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-4">
              <UserCircle className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">No candidates yet. Upload CVs to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">All Candidates</h2>
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-0">{candidates.length} total</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="text-xs font-semibold text-slate-500">Candidate</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">Email</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">Phone</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500">Uploaded</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow key={c.id} className="hover:bg-indigo-50/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 text-white text-xs font-bold">
                        {c.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="font-medium text-slate-900">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{c.email || "—"}</TableCell>
                  <TableCell className="text-slate-500">{c.phone || "—"}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{new Date(c.uploaded_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCandidate(c)} className="h-8 w-8 p-0 hover:bg-indigo-100 hover:text-indigo-600">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 text-white text-sm font-bold">
                {selectedCandidate?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              {selectedCandidate?.name || "Candidate Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="font-medium text-sm">{selectedCandidate.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="font-medium text-sm">{selectedCandidate.phone || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Parsed CV Content</p>
                <div className="bg-slate-50 rounded-xl p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto text-slate-600 leading-relaxed">
                  {selectedCandidate.parsed_data?.raw_text || "No parsed content available"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
