"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { Plus, Trash2, Edit2, Search, X, FileText, Briefcase, GraduationCap, Award } from "lucide-react";
import type { JobDescription, SkillRequirement } from "@/types";

const emptyJD = {
  title: "",
  department: "",
  description: "",
  required_skills: [] as SkillRequirement[],
  experience_level: "mid",
  min_experience_years: 0,
  education_requirements: [] as any[],
  certifications: [] as any[],
  criteria_weights: {
    skills: 0.35,
    experience: 0.25,
    education: 0.20,
    certifications: 0.10,
    overall_fit: 0.10,
  },
};

export default function JobDescriptionsPage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyJD });
  const [newSkill, setNewSkill] = useState("");
  const [newEdu, setNewEdu] = useState({ level: "", field: "" });
  const [newCert, setNewCert] = useState("");
  const [loading, setLoading] = useState(true);

  const loadJds = async () => {
    try {
      const data = await api.getJobDescriptions(search || undefined);
      setJds(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJds(); }, [search]);

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.updateJobDescription(editingId, form);
      } else {
        await api.createJobDescription(form);
      }
      setDialogOpen(false);
      setForm({ ...emptyJD });
      setEditingId(null);
      loadJds();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (jd: JobDescription) => {
    setForm({
      title: jd.title,
      department: jd.department,
      description: jd.description,
      required_skills: jd.required_skills || [],
      experience_level: jd.experience_level,
      min_experience_years: jd.min_experience_years,
      education_requirements: jd.education_requirements || [],
      certifications: jd.certifications || [],
      criteria_weights: jd.criteria_weights || emptyJD.criteria_weights,
    });
    setEditingId(jd.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job description?")) return;
    try { await api.deleteJobDescription(id); loadJds(); } catch (err: any) { alert(err.message); }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setForm({ ...form, required_skills: [...form.required_skills, { name: newSkill.trim(), weight: 1.0, required: true }] });
    setNewSkill("");
  };
  const removeSkill = (idx: number) => setForm({ ...form, required_skills: form.required_skills.filter((_, i) => i !== idx) });
  const addEducation = () => {
    if (!newEdu.level.trim()) return;
    setForm({ ...form, education_requirements: [...form.education_requirements, { level: newEdu.level, field: newEdu.field, required: true }] });
    setNewEdu({ level: "", field: "" });
  };
  const addCertification = () => {
    if (!newCert.trim()) return;
    setForm({ ...form, certifications: [...form.certifications, { name: newCert.trim(), required: false }] });
    setNewCert("");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-blue">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Job Descriptions</h1>
            <p className="text-slate-500 text-sm">Define positions and screening criteria</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setForm({ ...emptyJD }); setEditingId(null); }
        }}>
          <DialogTrigger render={<Button className="gap-2 gradient-blue border-0 text-white shadow-lg shadow-indigo-200" />}>
            <Plus className="h-4 w-4" /> Create JD
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Job Description" : "Create Job Description"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Frontend Developer" />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Engineering" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full job description..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Experience Level</Label>
                  <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v || "mid" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Min. Years of Experience</Label>
                  <Input type="number" value={form.min_experience_years} onChange={(e) => setForm({ ...form, min_experience_years: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4 text-indigo-500" /> Required Skills</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="e.g. React, Python, AWS..." onKeyDown={(e) => e.key === "Enter" && addSkill()} />
                  <Button onClick={addSkill} size="sm" className="shrink-0">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.required_skills.map((s, i) => (
                    <Badge key={i} variant={s.required ? "default" : "secondary"} className="gap-1 py-1.5 px-3">
                      {s.name}
                      <X className="h-3 w-3 cursor-pointer hover:text-red-300" onClick={() => removeSkill(i)} />
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-base font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-500" /> Education Requirements</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={newEdu.level} onChange={(e) => setNewEdu({ ...newEdu, level: e.target.value })} placeholder="Level (e.g. Bachelor's)" />
                  <Input value={newEdu.field} onChange={(e) => setNewEdu({ ...newEdu, field: e.target.value })} placeholder="Field" />
                  <Button onClick={addEducation} size="sm" className="shrink-0">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.education_requirements.map((e, i) => (
                    <Badge key={i} variant="outline" className="gap-1 py-1.5 px-3">
                      {e.level} {e.field && `in ${e.field}`}
                      <X className="h-3 w-3 cursor-pointer hover:text-red-300" onClick={() => setForm({ ...form, education_requirements: form.education_requirements.filter((_, j) => j !== i) })} />
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-base font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Certifications</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={newCert} onChange={(e) => setNewCert(e.target.value)} placeholder="e.g. AWS Solutions Architect" onKeyDown={(e) => e.key === "Enter" && addCertification()} />
                  <Button onClick={addCertification} size="sm" className="shrink-0">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.certifications.map((c, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 py-1.5 px-3">
                      {c.name}
                      <X className="h-3 w-3 cursor-pointer hover:text-red-300" onClick={() => setForm({ ...form, certifications: form.certifications.filter((_, j) => j !== i) })} />
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold">Scoring Weights</Label>
                <div className="grid grid-cols-5 gap-3 mt-2">
                  {([["skills", "Skills"], ["experience", "Experience"], ["education", "Education"], ["certifications", "Certs"], ["overall_fit", "Fit"]] as const).map(([key, label]) => (
                    <div key={key}>
                      <Label className="text-xs">{label}</Label>
                      <Input type="number" step="0.05" value={form.criteria_weights[key]} onChange={(e) => setForm({ ...form, criteria_weights: { ...form.criteria_weights, [key]: parseFloat(e.target.value) || 0 } })} />
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} className="w-full gradient-blue border-0 text-white shadow-lg shadow-indigo-200">
                {editingId ? "Update Job Description" : "Create Job Description"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search job descriptions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 h-11 rounded-xl border-slate-200 bg-white shadow-sm" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : jds.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mx-auto mb-4">
              <FileText className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">No job descriptions yet. Create one to start screening!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {jds.map((jd) => (
            <Card key={jd.id} className="border-0 shadow-md shadow-slate-100/80 hover:shadow-xl hover:shadow-indigo-100/40 transition-all duration-300 group">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-bold group-hover:bg-indigo-100 transition-colors">
                      {jd.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{jd.title}</h3>
                      <p className="text-xs text-slate-400">{jd.department || "No department"}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(jd)} className="h-8 w-8 p-0">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(jd.id)} className="h-8 w-8 p-0">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge className="bg-indigo-50 text-indigo-700 border-0 text-xs">{jd.experience_level}</Badge>
                  <Badge variant="outline" className="text-xs border-slate-200">{jd.min_experience_years}+ yrs</Badge>
                  {(jd.required_skills || []).slice(0, 4).map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-slate-50">{s.name}</Badge>
                  ))}
                  {(jd.required_skills || []).length > 4 && (
                    <Badge variant="secondary" className="text-xs bg-slate-50">+{(jd.required_skills || []).length - 4}</Badge>
                  )}
                </div>
                {jd.description && <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{jd.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
