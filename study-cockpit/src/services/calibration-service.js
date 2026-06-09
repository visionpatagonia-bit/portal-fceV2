'use strict';

function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

class CalibrationService {
  constructor({ telemetry }) {
    this.telemetry = telemetry;
    this.targetWithinOnePointRate = 0.7;
  }

  buildCases(events) {
    const attempts = events.filter((event) => event.type === 'attempt_scored');
    const grades = events.filter((event) => event.type === 'real_grade_reported');

    return grades.map((gradeEvent) => {
      const matchingAttempts = attempts.filter((attemptEvent) => (
        attemptEvent.subjectId === gradeEvent.subjectId &&
        attemptEvent.sessionId === gradeEvent.sessionId &&
        new Date(attemptEvent.createdAt).getTime() <= new Date(gradeEvent.createdAt).getTime()
      ));
      const attempt = matchingAttempts.at(-1);
      const estimated = Number(attempt?.payload?.total ?? attempt?.payload?.result?.total);
      const actual = Number(gradeEvent.payload?.realGrade);
      const error = Number.isFinite(estimated) && Number.isFinite(actual)
        ? Math.abs(estimated - actual)
        : null;

      return {
        subjectId: gradeEvent.subjectId,
        sessionId: gradeEvent.sessionId,
        attemptId: attempt?.attemptId || gradeEvent.attemptId || null,
        estimatedScore: Number.isFinite(estimated) ? estimated : null,
        realGrade: Number.isFinite(actual) ? actual : null,
        absoluteError: error,
        withinOnePoint: error !== null ? error <= 1 : false,
        scoreEventId: attempt?.eventId || null,
        gradeEventId: gradeEvent.eventId
      };
    }).filter((item) => item.estimatedScore !== null && item.realGrade !== null);
  }

  summarize(cases) {
    const errors = cases.map((item) => item.absoluteError).filter((item) => item !== null);
    const withinOnePointCount = cases.filter((item) => item.withinOnePoint).length;
    const calibrationWithin1ptRate = cases.length ? withinOnePointCount / cases.length : null;

    return {
      target: {
        metric: 'calibration_within_1pt_rate',
        requiredRate: this.targetWithinOnePointRate,
        definition: 'Score estimado dentro de +/- 1 punto de la nota real'
      },
      totalCases: cases.length,
      withinOnePointCount,
      calibrationWithin1ptRate,
      meanAbsoluteError: mean(errors),
      passTarget: calibrationWithin1ptRate !== null
        ? calibrationWithin1ptRate >= this.targetWithinOnePointRate
        : false,
      cases
    };
  }

  async getCalibration({ subjectId, sessionId } = {}) {
    const events = await this.telemetry.readEvents({ limit: 2000, subjectId, sessionId });
    return this.summarize(this.buildCases(events));
  }

  async recordRealGrade({ subjectId, sessionId, attemptId, realGrade, source = 'student_reported' }) {
    const gradeEvent = await this.telemetry.appendEvent({
      type: 'real_grade_reported',
      subjectId,
      sessionId,
      attemptId,
      actor: 'student',
      payload: {
        realGrade: Number(realGrade),
        source
      }
    });

    const calibration = await this.getCalibration({ subjectId, sessionId });
    const latestCase = calibration.cases.at(-1) || null;
    const calibrationEvent = await this.telemetry.appendEvent({
      type: 'calibration_evaluated',
      subjectId,
      sessionId,
      attemptId,
      actor: 'system',
      payload: {
        case: latestCase,
        summary: {
          totalCases: calibration.totalCases,
          calibrationWithin1ptRate: calibration.calibrationWithin1ptRate,
          meanAbsoluteError: calibration.meanAbsoluteError,
          passTarget: calibration.passTarget
        }
      }
    });

    return { gradeEvent, calibrationEvent, calibration };
  }
}

module.exports = {
  CalibrationService
};
