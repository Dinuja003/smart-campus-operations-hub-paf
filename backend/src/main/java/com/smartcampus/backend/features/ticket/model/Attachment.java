package com.smartcampus.backend.features.ticket.model;

import org.springframework.data.mongodb.core.mapping.Field;

public class Attachment {

    @Field("fileName")
    private String fileName;
    private String fileType;
    @Field("url")
    private String filePath;
    private int fileSize;

    public Attachment() {
    }

    public Attachment(String fileName, String fileType, String filePath, int fileSize) {
        this.fileName = fileName;
        this.fileType = fileType;
        this.filePath = filePath;
        this.fileSize = fileSize;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public int getFileSize() {
        return fileSize;
    }

    public void setFileSize(int fileSize) {
        this.fileSize = fileSize;
    }
}