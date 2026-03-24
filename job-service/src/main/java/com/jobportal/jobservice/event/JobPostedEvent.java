package com.jobportal.jobservice.event;

public class JobPostedEvent {
    private Long jobId;
    private String title;
    private String companyName;

    public JobPostedEvent() {
    }

    public JobPostedEvent(Long jobId, String title, String companyName) {
        this.jobId = jobId;
        this.title = title;
        this.companyName = companyName;
    }

    public Long getJobId() {
        return jobId;
    }

    public String getTitle() {
        return title;
    }

    public String getCompanyName() {
        return companyName;
    }
}
