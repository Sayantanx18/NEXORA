import { api } from "./client";

export const investigationAPI = {
    getCase: (caseId) =>
        api.get(`/api/v1/cases/${caseId}`),

    investigate: (caseId) =>
        api.get(`/api/v1/investigations/${caseId}`),

    requestEvidence: (caseId, payload) =>
        api.post(
            `/api/v1/investigations/${caseId}/request-evidence`,
            payload
        ),

    requestApproval: (caseId, payload) =>
        api.post(
            `/api/v1/investigations/${caseId}/request-approval`,
            payload
        ),

    approve: (approvalRefId) =>
        api.post(
            `/api/v1/investigations/approvals/${approvalRefId}/approve`,
            {}
        ),

    reject: (approvalRefId) =>
        api.post(
            `/api/v1/investigations/approvals/${approvalRefId}/reject`,
            {}
        ),
};
