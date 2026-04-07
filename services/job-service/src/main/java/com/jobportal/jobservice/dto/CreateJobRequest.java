package com.jobportal.jobservice.dto;

import java.math.BigDecimal;

public class CreateJobRequest {
    private String title;
    private String companyName;
    private String jobType;
    private String location;
    private BigDecimal salary;
    private Integer experience;
    private String description;
    private Integer openings;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }
    public Integer getExperience() { return experience; }
    public void setExperience(Integer experience) { this.experience = experience; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getOpenings() { return openings; }
    public void setOpenings(Integer openings) { this.openings = openings; }
}
