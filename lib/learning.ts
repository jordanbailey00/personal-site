import { learningData, LearningSubject } from "../content/learning";

export async function getLearningRecs(): Promise<LearningSubject[]> {
    return learningData;
}

export async function getSubjectById(id: string): Promise<LearningSubject | undefined> {
    return learningData.find(subject => subject.id === id);
}
