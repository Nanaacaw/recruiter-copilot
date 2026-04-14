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
import { cn } from "@/lib/utils";
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
  ChevronDown,
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

const buildCriteriaWeights = (weights?: Partial<CriteriaWeights> | null): CriteriaWeights => ({
  ...defaultWeights,
  ...(weights ?? {}),
});

const createEmptyJobDescription = (): JobDescriptionForm => ({
  title: "",
  department: "",
  description: "",
  required_skills: [],
  experience_level: "mid",
  min_experience_years: 0,
  education_requirements: [],
  certifications: [],
  criteria_weights: buildCriteriaWeights(),
});

const weightFields: Array<{ key: keyof CriteriaWeights; label: string }> = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "certifications", label: "Certifications" },
  { key: "overall_fit", label: "Overall fit" },
];

const experienceLevelLabels: Record<string, string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
};

type EditorSectionKey = "skills" | "education" | "certifications";

const createExpandedSections = (): Record<EditorSectionKey, boolean> => ({
  skills: true,
  education: true,
  certifications: true,
});

export default function JobDescriptionsPage() {
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobDescriptionForm>(createEmptyJobDescription());
  const [expandedSections, setExpandedSections] = useState<Record<EditorSectionKey, boolean>>(createExpandedSections());
  const [newSkill, setNewSkill] = useState("");
  const [newEdu, setNewEdu] = useState({ level: "", field: "" });
  const [newCert, setNewCert] = useState("");
  const [loading, setLoading] = useState(true);

  const totalRequiredSkills = jds.reduce((count, jd) => count + (jd.required_skills?.length || 0), 0);
  const averageSkillsPerRole = jds.length > 0 ? (totalRequiredSkills / jds.length).toFixed(1) : "0.0";
  const totalWeight = Object.values(form.criteria_weights).reduce((sum, value) => sum + value, 0);
  const totalWeightPercent = Math.round(totalWeight * 100);
  const isWeightBalanced = Math.abs(totalWeight - 1) < 0.001;
  const dominantWeightField = weightFields.reduce(
    (selected, field) =>
      form.criteria_weights[field.key] > form.criteria_weights[selected.key] ? field : selected,
    weightFields[0]!
  );

  const resetEditor = () => {
    setForm(createEmptyJobDescription());
    setExpandedSections(createExpandedSections());
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
      required_skills: (jd.required_skills || []).map((skill) => ({ ...skill })),
      experience_level: jd.experience_level,
      min_experience_years: jd.min_experience_years,
      education_requirements: (jd.education_requirements || []).map((item) => ({ ...item })),
      certifications: (jd.certifications || []).map((item) => ({ ...item })),
      criteria_weights: buildCriteriaWeights(jd.criteria_weights),
    });
    setExpandedSections(createExpandedSections());
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

  const toggleSection = (section: EditorSectionKey) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const removeSkill = (index: number) => {
    setForm((current) => ({
      ...current,
      required_skills: current.required_skills.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const removeEducation = (index: number) => {
    setForm((current) => ({
      ...current,
      education_requirements: current.education_requirements.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const removeCertification = (index: number) => {
    setForm((current) => ({
      ...current,
      certifications: current.certifications.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  return (
    <div className="page-shell space-y-8">
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetEditor();
        }}
      >
        <section className="rounded-[1.75rem] border border-sky-100 bg-white px-6 py-6 shadow-sm lg:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                <Briefcase className="h-3.5 w-3.5" />
                Job description workspace
              </div>

              <div>
                <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                  Write role briefs in a simpler, cleaner workspace.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                  This version reduces the visual noise and keeps the top area focused on three things:
                  current job description volume, current skill coverage, and one clear action to open the editor.
                </p>
              </div>

              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by title, department, or keyword..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-12 rounded-2xl border-sky-100 bg-slate-50/70 pl-11 shadow-none"
                />
              </div>
            </div>

            <div className="w-full max-w-md rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Editor action</p>
              <p className="mt-3 text-xl font-semibold text-slate-900">Create or update a role brief</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Open the editor to define the role scope, required skills, experience level, and education requirements in one place.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Role scope", "Skills", "Education"].map((item) => (
                  <Badge key={item} className="rounded-full border border-sky-100 bg-white text-slate-700">
                    {item}
                  </Badge>
                ))}
              </div>
              <DialogTrigger
                render={
                  <Button className="mt-5 h-11 rounded-2xl gradient-blue border-0 px-5 text-white shadow-md shadow-sky-200" />
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {editingId ? "Continue editing" : "Create new job description"}
              </DialogTrigger>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card className="border border-sky-100 bg-slate-50/70 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total JDs</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{loading ? 0 : jds.length}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Structured roles currently available in the workspace.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-sky-100 bg-slate-50/70 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Required skills</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{totalRequiredSkills}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Total skill items already defined across all job descriptions.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-sky-100 bg-slate-50/70 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Average per role</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{averageSkillsPerRole}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Average required skill items defined per job description.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <DialogContent
          showCloseButton={false}
          className="flex max-h-[92vh] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-0 sm:max-w-6xl"
        >
          <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
            <div className="grid min-h-full lg:h-full lg:min-h-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-6 md:p-8 lg:min-h-0 lg:overflow-y-auto">
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
                      <p className="text-sm text-slate-500">
                        Start with the job title, department, and core role description.
                      </p>
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
                      <p className="text-sm text-slate-500">
                        Set the seniority and minimum years so screening has better guardrails.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Experience level</Label>
                        <Select
                          value={form.experience_level}
                          onValueChange={(value) => setForm({ ...form, experience_level: value || "mid" })}
                        >
                          <SelectTrigger className="h-12 w-full rounded-xl">
                            <SelectValue>{experienceLevelLabels[form.experience_level] || "Mid"}</SelectValue>
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

              <div className="border-t border-slate-200/80 bg-slate-50/80 p-6 md:p-8 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
                <div className="space-y-5">
                  <Card className="border border-sky-200/70 bg-white shadow-sm">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-slate-900">Hiring brief snapshot</p>
                          <p className="truncate text-sm font-medium text-slate-700">
                            {form.title.trim() || "Untitled role"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {form.department.trim() || "Department not set"} -{" "}
                            {experienceLevelLabels[form.experience_level] || "Mid"} level
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Skills</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">{form.required_skills.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Education</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {form.education_requirements.length}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Certificates</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                            {form.certifications.length}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full border-0 bg-sky-100 text-sky-700">
                          Primary emphasis: {dominantWeightField.label}
                        </Badge>
                        <Badge
                          className={
                            isWeightBalanced
                              ? "rounded-full border-0 bg-emerald-100 text-emerald-700"
                              : "rounded-full border-0 bg-amber-100 text-amber-700"
                          }
                        >
                          Weight total: {totalWeightPercent}%
                        </Badge>
                      </div>

                      <p className="text-xs leading-5 text-slate-500">
                        {form.description.trim()
                          ? "Role context is filled in. Review the criteria below and keep the weights balanced for consistent screening."
                          : "Add the role summary on the left so recruiters and AI share the same context before scoring candidates."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-sky-200/70 bg-white/95 shadow-sm lg:sticky lg:top-6 lg:z-10 supports-[backdrop-filter]:bg-white/85 supports-[backdrop-filter]:backdrop-blur">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Scoring weights</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Keep this panel nearby while you refine the supporting criteria below.
                          </p>
                        </div>
                        <Badge
                          className={
                            isWeightBalanced
                              ? "rounded-full border-0 bg-emerald-100 text-emerald-700"
                              : "rounded-full border-0 bg-amber-100 text-amber-700"
                          }
                        >
                          {totalWeightPercent}%
                        </Badge>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {weightFields.map((field) => (
                          <div
                            key={field.key}
                            className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          >
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
                      <p
                        className={
                          isWeightBalanced
                            ? "text-xs leading-5 text-emerald-600"
                            : "text-xs leading-5 text-amber-600"
                        }
                      >
                        {isWeightBalanced
                          ? "Weight total is balanced at 100%, so screening output should stay easier to interpret."
                          : "Tip: keep the total close to 100% so the final screening score stays predictable."}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200/80 bg-white shadow-sm">
                    <CardContent className="p-0">
                      <button
                        type="button"
                        onClick={() => toggleSection("skills")}
                        className="flex w-full items-start justify-between gap-3 p-5 text-left"
                      >
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Briefcase className="h-4 w-4 text-indigo-600" />
                            Required skills
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Add the skills HR wants the AI to actively check for.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                            {form.required_skills.length}
                          </Badge>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-slate-400 transition-transform duration-200",
                              expandedSections.skills && "rotate-180"
                            )}
                          />
                        </div>
                      </button>
                      {expandedSections.skills && (
                        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              value={newSkill}
                              onChange={(event) => setNewSkill(event.target.value)}
                              placeholder="React, TypeScript, FastAPI..."
                              onKeyDown={(event) => event.key === "Enter" && addSkill()}
                              className="h-11 rounded-xl"
                            />
                            <Button onClick={addSkill} className="rounded-xl px-4 sm:self-start">
                              Add
                            </Button>
                          </div>
                          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                            {form.required_skills.length === 0 ? (
                              <p className="text-xs text-slate-400">No skills added yet.</p>
                            ) : (
                              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
                                {form.required_skills.map((skill, index) => (
                                  <Badge
                                    key={`${skill.name}-${index}`}
                                    className="h-auto max-w-full items-start gap-2 overflow-visible rounded-2xl border-0 bg-indigo-50 px-3 py-2 text-left whitespace-normal break-words text-indigo-700"
                                  >
                                    <span className="min-w-0 break-words leading-5">{skill.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeSkill(index)}
                                      className="mt-0.5 shrink-0 rounded-full p-0.5 text-indigo-500 transition hover:bg-indigo-100 hover:text-indigo-700"
                                      aria-label={`Remove ${skill.name}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200/80 bg-white shadow-sm">
                    <CardContent className="p-0">
                      <button
                        type="button"
                        onClick={() => toggleSection("education")}
                        className="flex w-full items-start justify-between gap-3 p-5 text-left"
                      >
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <GraduationCap className="h-4 w-4 text-emerald-600" />
                            Education requirements
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            List degree level and, if needed, the preferred field.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                            {form.education_requirements.length}
                          </Badge>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-slate-400 transition-transform duration-200",
                              expandedSections.education && "rotate-180"
                            )}
                          />
                        </div>
                      </button>
                      {expandedSections.education && (
                        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
                          <div className="grid gap-2 md:grid-cols-[0.95fr_1.05fr_auto]">
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
                          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                            {form.education_requirements.length === 0 ? (
                              <p className="text-xs text-slate-400">No education requirements added yet.</p>
                            ) : (
                              <div className="grid max-h-48 gap-2 overflow-y-auto pr-1">
                                {form.education_requirements.map((item, index) => (
                                  <div
                                    key={`${item.level}-${item.field}-${index}`}
                                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-700"
                                  >
                                    <div className="min-w-0 space-y-1">
                                      <p className="break-words text-sm font-medium leading-5 text-slate-900">
                                        {item.level}
                                      </p>
                                      {item.field ? (
                                        <p className="break-words text-xs leading-5 text-slate-500">{item.field}</p>
                                      ) : (
                                        <p className="text-xs leading-5 text-slate-400">Field not specified</p>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeEducation(index)}
                                      className="mt-0.5 shrink-0 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                      aria-label={`Remove ${item.level}${item.field ? ` in ${item.field}` : ""}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200/80 bg-white shadow-sm">
                    <CardContent className="p-0">
                      <button
                        type="button"
                        onClick={() => toggleSection("certifications")}
                        className="flex w-full items-start justify-between gap-3 p-5 text-left"
                      >
                        <div>
                          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Award className="h-4 w-4 text-amber-600" />
                            Certifications
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Add optional certificates that strengthen the candidate profile.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                            {form.certifications.length}
                          </Badge>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-slate-400 transition-transform duration-200",
                              expandedSections.certifications && "rotate-180"
                            )}
                          />
                        </div>
                      </button>
                      {expandedSections.certifications && (
                        <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              value={newCert}
                              onChange={(event) => setNewCert(event.target.value)}
                              placeholder="AWS Solutions Architect"
                              onKeyDown={(event) => event.key === "Enter" && addCertification()}
                              className="h-11 rounded-xl"
                            />
                            <Button onClick={addCertification} className="rounded-xl px-4 sm:self-start">
                              Add
                            </Button>
                          </div>
                          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                            {form.certifications.length === 0 ? (
                              <p className="text-xs text-slate-400">No certifications added yet.</p>
                            ) : (
                              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
                                {form.certifications.map((item, index) => (
                                  <Badge
                                    key={`${item.name}-${index}`}
                                    className="h-auto max-w-full items-start gap-2 overflow-visible rounded-2xl border-0 bg-amber-50 px-3 py-2 text-left whitespace-normal break-words text-amber-700"
                                  >
                                    <span className="min-w-0 break-words leading-5">{item.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeCertification(index)}
                                      className="mt-0.5 shrink-0 rounded-full p-0.5 text-amber-500 transition hover:bg-amber-100 hover:text-amber-700"
                                      aria-label={`Remove ${item.name}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
              className="rounded-xl gradient-blue px-5 text-white shadow-lg shadow-sky-200"
            >
              {editingId ? "Save changes" : "Create job description"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading job descriptions...</div>
      ) : jds.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">No job descriptions yet. Create one to start screening candidates.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {jds.map((jd) => (
            <Card
              key={jd.id}
              className="border border-sky-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sm font-bold text-sky-700">
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
                      {jd.experience_level} - {jd.min_experience_years}+ yrs
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
                    <Badge key={`${jd.id}-skill-${index}`} className="rounded-full border-0 bg-sky-50 text-sky-700">
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
