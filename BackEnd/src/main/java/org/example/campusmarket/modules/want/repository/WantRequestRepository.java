package org.example.campusmarket.modules.want.repository;

import org.example.campusmarket.modules.want.entity.WantRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WantRequestRepository extends JpaRepository<WantRequest, Long> {
    long countByStatus(String status);
}