package com.jobportal.authservice.dto;

import com.jobportal.authservice.model.Role;

public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String phone;

    public UserResponse(Long id, String name, String email, Role role, String phone) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phone = phone;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public String getPhone() {
        return phone;
    }
}
