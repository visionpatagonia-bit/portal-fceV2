'use strict';

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

class ExamContractService {
  constructor({ root }) {
    this.root = root;
    this.subjectsRoot = path.join(root, 'data', 'subjects');
  }

  async listSubjects() {
    const dirs = await fs.readdir(this.subjectsRoot, { withFileTypes: true });
    const subjects = [];

    for (const dir of dirs.filter((entry) => entry.isDirectory())) {
      const profilePath = path.join(this.subjectsRoot, dir.name, 'exam-profile.json');
      if (!fsSync.existsSync(profilePath)) continue;

      const profile = await readJson(profilePath);
      subjects.push({
        id: profile.subject?.id || dir.name,
        folder: dir.name,
        name: profile.subject?.name || dir.name,
        accentColor: profile.subject?.accentColor || '#58a6ff',
        blocks: profile.blocks?.length || 0,
        variants: profile.variants?.length || 0,
        evidence: profile.assessment?.evidence || [],
        passPoints: profile.assessment?.passPoints || null,
        promotionPoints: profile.assessment?.promotionPoints || null
      });
    }

    return subjects.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async getContractByFolder(folder) {
    const profilePath = path.join(this.subjectsRoot, folder, 'exam-profile.json');
    if (!fsSync.existsSync(profilePath)) return null;
    return readJson(profilePath);
  }

  async resolveSubject(subjectRef) {
    const subjects = await this.listSubjects();
    const subject = subjects.find((item) => item.id === subjectRef || item.folder === subjectRef);
    if (!subject) return null;
    const contract = await this.getContractByFolder(subject.folder);
    return { subject, contract };
  }

  async getContractBySubjectId(subjectId) {
    const resolved = await this.resolveSubject(subjectId);
    return resolved?.contract || null;
  }

  summarizeContract(contract) {
    if (!contract) return null;
    return {
      subject: contract.subject,
      assessment: contract.assessment,
      blocks: contract.blocks || [],
      conceptFamilies: contract.conceptFamilies || [],
      variants: (contract.variants || []).map((variant) => ({
        id: variant.id,
        label: variant.label,
        evidenceType: variant.evidenceType,
        blocks: variant.blocks?.length || 0
      }))
    };
  }
}

module.exports = {
  ExamContractService
};
