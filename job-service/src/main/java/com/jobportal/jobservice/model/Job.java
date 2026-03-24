package com.jobportal.jobservice.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(name = "company_name")
    private String companyName;

    private String location;

    private BigDecimal salary;

    private Integer experience;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "posted_by")
    private Long postedBy;

    @Column(name = "recruiter_id")
    private Long recruiterId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        syncRecruiterFields();
    }

    @PreUpdate
    public void preUpdate() {
        syncRecruiterFields();
    }

    private void syncRecruiterFields() {
        if (this.recruiterId == null && this.postedBy != null) {
            this.recruiterId = this.postedBy;
        }
        if (this.postedBy == null && this.recruiterId != null) {
            this.postedBy = this.recruiterId;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public BigDecimal getSalary() { return salary; }
    public void setSalary(BigDecimal salary) { this.salary = salary; }
    public Integer getExperience() { return experience; }
    public void setExperience(Integer experience) { this.experience = experience; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getPostedBy() { return postedBy; }
    public void setPostedBy(Long postedBy) {
        this.postedBy = postedBy;
        if (postedBy != null) {
            this.recruiterId = postedBy;
        }
    }
    public Long getRecruiterId() { return recruiterId; }
    public void setRecruiterId(Long recruiterId) {
        this.recruiterId = recruiterId;
        if (recruiterId != null) {
            this.postedBy = recruiterId;
        }
    }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
