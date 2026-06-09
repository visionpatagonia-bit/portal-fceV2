'use strict';

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

class StudyContentService {
  constructor({ root, contractService }) {
    this.root = root;
    this.contractService = contractService;
  }

  async getStudyMap(subjectRef) {
    const resolved = await this.contractService.resolveSubject(subjectRef);
    if (!resolved) return null;

    const filePath = path.join(this.root, 'data', 'subjects', resolved.subject.folder, 'study-map.json');
    if (!fsSync.existsSync(filePath)) return null;

    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  }

  async getStudyBlock(subjectRef, blockIdOrCode) {
    const studyMap = await this.getStudyMap(subjectRef);
    if (!studyMap) return null;

    const needle = String(blockIdOrCode || '').toLowerCase();
    return studyMap.blocks.find((block) => (
      block.id.toLowerCase() === needle ||
      block.code.toLowerCase() === needle
    )) || null;
  }

  async buildPlan(subjectRef) {
    const studyMap = await this.getStudyMap(subjectRef);
    if (!studyMap) return null;

    return {
      schemaVersion: studyMap.schemaVersion,
      subjectId: studyMap.subjectId,
      title: studyMap.title,
      northStar: studyMap.northStar,
      examFlow: studyMap.examFlow,
      calibration: studyMap.calibration || null,
      confusablePairs: Array.isArray(studyMap.confusablePairs) ? studyMap.confusablePairs : [],
      blocks: studyMap.blocks.map((block) => ({
        id: block.id,
        code: block.code,
        label: block.label,
        priority: block.priority,
        examWeight: block.examWeight,
        studyMinutes: block.studyMinutes,
        examSkill: block.examSkill,
        whyItMatters: block.whyItMatters,
        objectivesCount: block.learningObjectives.length,
        drillsCount: block.drills.length
      }))
    };
  }
}

module.exports = {
  StudyContentService
};
