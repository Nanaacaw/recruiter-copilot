"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type {
  CertificationRequirement,
  CriteriaWeights,
  EducationRequirement,
  JobDescription,
  SkillRequirement,
} from "@/types";
import {
  Award,
  Briefcase,
  Edit2,
  FileText,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type JobDescriptionForm = {
  title: string;
  department: string;
  description: string;
  required_skills: SkillRequirement[];
  experience_level: string;
  min_experience_years: number;
  education_requirements: EducationRequirement[];
  certifications: CertificationRequirement[];
  criteria_weights: CriteriaWeights;
};

const defaultWeights: CriteriaWeights = {
  skills: 0.35,
  experience: 0.25,
  education: 0.2,
  certifications: 0.1,
  overall_fit: 0.1,
};

const emptyJD: JobDescriptionForm = {
  title: "",
  department: "",
  description: "",
  required_skills: [],
  experience_level: "mid",
  min_experience_years: 0,
  education_requirements: [],
  certifications: [],
  criteria_weights: defaultWeights,
};

const weightFields: Array<{ key: keyof CriteriaWeights; label: string }> = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "certifications", label: "Certifications" },
  { key: "overall_fit", label: "Overall fit" },
];

export default function JobDescriptionsPage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobDescriptionForm>({ ...emptyJD });
  const [newSkill, setNewSkill] = useState("");
  const [newEdu, setNewEdu] = useState({ level: "", field: "" });
  const [newCert, setNewCert] = useState("");
  const [loading, setLoading] = useState(true);

  const resetEditor = () => {
    setForm({ ...emptyJD, criteria_weights: { ...defaultWeights } });
    setEditingId(null);
    setNewSkill("");
    setNewEdu({ level: "", field: "" });
    setNewCert("");
  };

  const loadJds = async () => {
    try {
      const data = await api.getJobDescriptions(search || undefined);
      setJds(data);
    } catch {
      setJds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJds();
  }, [search]);

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.updateJobDescription(editingId, form);
      } else {
        await api.createJobDescription(form);
      }
      setDialogOpen(false);
      resetEditor();
      loadJds();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
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
      criteria_weights: jd.criteria_weights || { ...defaultWeights },
    });
    setEditingId(jd.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job description?")) return;
    try {
      await api.deleteJobDescription(id);
      loadJds();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setForm((current) => ({
      ...current,
      required_skills: [
        ...current.required_skills,
        { name: newSkill.trim(), weight: 1, required: true },
      ],
    }));
    setNewSkill("");
  };

  const addEducation = () => {
    if (!newEdu.level.trim()) return;
    setForm((current) => ({
      ...current,
      education_requirements: [
        ...current.education_requirements,
        {
          level: newEdu.level.trim(),
          field: newEdu.field.trim(),
          required: true,
        },
      ],
    }));
    setNewEdu({ level: "", field: "" });
  };

  const addCertification = () => {
    if (!newCert.trim()) return;
    setForm((current) => ({
      ...current,
      certifications: [
        ...current.certifications,
        {
          name: newCert.trim(),
          required: false,
        },
      ],
    }));
    setNewCert("");
  };

  return (
    <div className="page-shell">
      <section className="hero-mesh soft-panel overflow-hidden rounded-[2rem] border-0">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.9fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
              Hiring brief workspace
            </div>

            <div>
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Create job descriptions in a format that is actually comfortable to fill in.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                The editor is now larger and grouped into clear sections, so HR can enter title, scope,
                requirements, and scoring without feeling squeezed into a tiny modal.
              </p>
            </div>

            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by title, department, or keyword..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-white/90 pl-11 shadow-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <Card className="border-0 bg-white/80 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Total JDs</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? 0 : jds.length}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Structured roles available for screening.</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/80 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Required skills</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {jds.reduce((count, jd) => count + (jd.required_skills?.length || 0), 0)}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Across all job descriptions in the workspace.</p>
              </CardContent>
            </Card>
            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetEditor();
              }}
            >
              <DialogTrigger
                render={
                  <Button className="h-full min-h-36 rounded-[1.75rem] border-0 gradient-blue p-6 text-left text-white shadow-xl shadow-blue-200" />
                }
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">Create new JD</p>
                    <p className="text-sm leading-6 text-white/85">
                      Open the larger editor to define role scope, skills, education, and scoring weights.
                    </p>
                  </div>
                </div>
              </DialogTrigger>

              <DialogContent
                showCloseButton={false}
                className="max-h-[92vh] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-0 sm:max-w-6xl"
              >
                <div className="grid h-full min-h-0 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="min-h-0 overflow-y-auto p-6 md:p-8">
                    <DialogHeader className="gap-3">
                      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                        <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
                        {editingId ? "Edit job description" : "Create job description"}
                      </div>
                      <DialogTitle className="text-2xl text-slate-900">
                        {editingId ? "Update this hiring brief" : "Build a recruiter-ready hiring brief"}
                      </DialogTitle>
                      <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-500">
                        Capture the essentials first, then add the supporting criteria on the right. This layout is
                        intentionally wide so entering title, department, description, and requirements feels easier.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="mt-8 space-y-8">
                      <section className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Role basics</p>
                          <p className="text-sm text-slate-500">Start with the job title, department, and core role description.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                              value={form.title}
                              onChange={(event) => setForm({ ...form, title: event.target.value })}
                              placeholder="Senior Frontend Developer"
                              className="h-12 rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Department</Label>
                            <Input
                              value={form.department}
                              onChange={(event) => setForm({ ...form, department: event.target.value })}
                              placeholder="Engineering"
                              className="h-12 rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={form.description}
                            onChange={(event) => setForm({ ...form, description: event.target.value })}
                            placeholder="Outline the role mission, responsibilities, stack, and the outcomes expected from the hire."
                            rows={10}
                            className="min-h-[260px] rounded-2xl"
                          />
                        </div>
                      </section>

                      <section className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Experience expectations</p>
                          <p className="text-sm text-slate-500">Set the seniority and minimum years so screening has better guardrails.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Experience level</Label>
                            <Select
                              value={form.experience_level}
                              onValueChange={(value) => setForm({ ...form, experience_level: value || "mid" })}
                            >
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="junior">Junior</SelectItem>
                                <SelectItem value="mid">Mid</SelectItem>
                                <SelectItem value="senior">Senior</SelectItem>
                                <SelectItem value="lead">Lead</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Minimum years</Label>
                            <Input
                              type="number"
                              value={form.min_experience_years}
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  min_experience_years: Number.parseInt(event.target.value, 10) || 0,
                                })
                              }
                              className="h-12 rounded-xl"
                            />
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto border-t border-slate-200/80 bg-slate-50/80 p-6 md:p-8 lg:border-l lg:border-t-0">
                    <div className="space-y-5">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full border-0 bg-indigo-100 text-indigo-700">
                          {form.required_skills.length} skill{form.required_skills.length === 1 ? "" : "s"}
                        </Badge>
                        <Badge className="rounded-full border-0 bg-emerald-100 text-emerald-700">
                          {form.education_requirements.length} education item{form.education_requirements.length === 1 ? "" : "s"}
                        </Badge>
                        <Badge className="rounded-full border-0 bg-amber-100 text-amber-700">
                          {form.certifications.length} certification{form.certifications.length === 1 ? "" : "s"}
                        </Badge>
                      </div>

                      <Card className="border border-slate-200/80 bg-white shadow-sm">
                        <CardContent className="space-y-4 p-5">
                          <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <Briefcase className="h-4 w-4 text-indigo-600" />
                              Required skills
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">Add the skills HR wants the AI to actively check for.</p>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newSkill}
                              onChange={(event) => setNewSkill(event.target.value)}
                              placeholder="React, TypeScript, FastAPI..."
                              onKeyDown={(event) => event.key === "Enter" && addSkill()}
                              className="h-11 rounded-xl"
                            />
                            <Button onClick={addSkill} className="rounded-xl px-4">
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {form.required_skills.length === 0 ? (
                              <p className="text-xs text-slate-400">No skills added yet.</p>
                            ) : (
                              form.required_skills.map((skill, index) => (
                                <Badge key={`${skill.name}-${index}`} className="gap-1 rounded-full border-0 bg-indigo-50 px-3 py-1.5 text-indigo-700">
                                  {skill.name}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() =>
                                      setForm((current) => ({
                                        ...current,
                                        required_skills: current.required_skills.filter((_, itemIndex) => itemIndex !== index),
                                      }))
                                    }
                                  />
                                </Badge>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-slate-200/80 bg-white shadow-sm">
                        <CardContent className="space-y-4 p-5">
                          <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <GraduationCap className="h-4 w-4 text-emerald-600" />
                              Education requirements
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">List degree level and, if needed, the preferred field.</p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-[0.95fr_1.05fr_auto]">
                            <Input
                              value={newEdu.level}
                              onChange={(event) => setNewEdu({ ...newEdu, level: event.target.value })}
                              placeholder="Bachelor's"
                              className="h-11 rounded-xl"
                            />
                            <Input
                              value={newEdu.field}
                              onChange={(event) => setNewEdu({ ...newEdu, field: event.target.value })}
                              placeholder="Computer Science"
                              className="h-11 rounded-xl"
                            />
                            <Button onClick={addEducation} className="rounded-xl px-4">
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {form.education_requirements.length === 0 ? (
                              <p className="text-xs text-slate-400">No education requirements added yet.</p>
                            ) : (
                              form.education_requirements.map((item, index) => (
                                <Badge key={`${item.level}-${item.field}-${index}`} variant="outline" className="gap-1 rounded-full border-slate-200 px-3 py-1.5 text-slate-700">
                                  {item.level}
                                  {item.field ? ` in ${item.field}` : ""}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() =>
                                      setForm((current) => ({
                                        ...current,
                                        education_requirements: current.education_requirements.filter(
                                          (_, itemIndex) => itemIndex !== index
                                        ),
                                      }))
                                    }
                                  />
                                </Badge>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-slate-200/80 bg-white shadow-sm">
                        <CardContent className="space-y-4 p-5">
                          <div>
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <Award className="h-4 w-4 text-amber-600" />
                              Certifications
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">Add optional certificates that strengthen the candidate profile.</p>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newCert}
                              onChange={(event) => setNewCert(event.target.value)}
                              placeholder="AWS Solutions Architect"
                              onKeyDown={(event) => event.key === "Enter" && addCertification()}
                              className="h-11 rounded-xl"
                            />
                            <Button onClick={addCertification} className="rounded-xl px-4">
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {form.certifications.length === 0 ? (
                              <p className="text-xs text-slate-400">No certifications added yet.</p>
                            ) : (
                              form.certifications.map((item, index) => (
                                <Badge key={`${item.name}-${index}`} className="gap-1 rounded-full border-0 bg-amber-50 px-3 py-1.5 text-amber-700">
                                  {item.name}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() =>
                                      setForm((current) => ({
                                        ...current,
                                        certifications: current.certifications.filter((_, itemIndex) => itemIndex !== index),
                                      }))
                                    }
                                  />
                                </Badge>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-slate-200/80 bg-white shadow-sm">
                        <CardContent className="space-y-4 p-5">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Scoring weights</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">Adjust how much each dimension influences the final screening score.</p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {weightFields.map((field) => (
                              <div key={field.key} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                <Label className="text-xs text-slate-500">{field.label}</Label>
                                <Input
                                  type="number"
                                  step="0.05"
                                  value={form.criteria_weights[field.key]}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      criteria_weights: {
                                        ...current.criteria_weights,
                                        [field.key]: Number.parseFloat(event.target.value) || 0,
                                      },
                                    }))
                                  }
                                  className="h-10 rounded-xl bg-white"
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 md:px-8">
                  <DialogClose render={<Button variant="outline" className="rounded-xl border-slate-200 px-5" />}>
                    Cancel
                  </DialogClose>
                  <Button
                    onClick={handleSave}
                    disabled={!form.title.trim()}
                    className="rounded-xl gradient-blue px-5 text-white shadow-lg shadow-blue-200"
                  >
                    {editingId ? "Save changes" : "Create job description"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading job descriptions...</div>
      ) : jds.length === 0 ? (
        <Card className="mt-8 border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">No job descriptions yet. Create one to start screening candidates.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          {jds.map((jd) => (
            <Card
              key={jd.id}
              className="border-0 bg-white/90 shadow-md shadow-slate-100/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-600">
                      {jd.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-900">{jd.title}</h3>
                      <p className="truncate text-sm text-slate-500">{jd.department || "No department set"}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(jd)} className="h-9 w-9 rounded-xl p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(jd.id)} className="h-9 w-9 rounded-xl p-0 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">Experience</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {jd.experience_level} · {jd.min_experience_years}+ yrs
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">Skills</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{jd.required_skills?.length || 0} items</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">Certifications</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{jd.certifications?.length || 0} items</p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
                  {jd.description || "No description entered yet."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(jd.required_skills || []).slice(0, 5).map((skill, index) => (
                    <Badge key={`${jd.id}-skill-${index}`} className="rounded-full border-0 bg-indigo-50 text-indigo-700">
                      {skill.name}
                    </Badge>
                  ))}
                  {(jd.required_skills || []).length > 5 ? (
                    <Badge className="rounded-full border-0 bg-slate-100 text-slate-700">
                      +{(jd.required_skills || []).length - 5} more
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
