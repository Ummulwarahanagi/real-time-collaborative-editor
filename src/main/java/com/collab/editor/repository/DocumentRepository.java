package com.collab.editor.repository;

import com.collab.editor.model.EditorDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DocumentRepository extends MongoRepository<EditorDocument, String> {
}