package com.smartcampus.backend.features.Resources.Model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class Location {

    @NotBlank(message = "Building is required")
    private String building;

    @NotBlank(message = "Floor is required")
    @Pattern(regexp = "\\d+", message = "Floor number must be a number")
    private String floor;

    @NotBlank(message = "Room is required")
    private String room;

    public Location() {
    }

    public Location(String building, String floor, String room) {
        this.building = building;
        this.floor = floor;
        this.room = room;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }
}
