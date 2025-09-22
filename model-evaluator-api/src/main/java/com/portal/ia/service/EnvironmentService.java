package com.portal.ia.service;

import com.portal.ia.entity.Environment;
import com.portal.ia.entity.Project;
import com.portal.ia.repository.EnvironmentRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;



@Service
public class EnvironmentService {

    private final  EnvironmentRepository  repository;

    public EnvironmentService(EnvironmentRepository repository) {
        this.repository = repository;
    }

    public List<Environment> getAll() {
        return repository.findAll();
    }

    public Optional<Environment> getById(Long id) {
        return repository.findById(id);
    }

    public Optional<Environment> getByType(String type) {
        return repository.findByType(type);
    }

    public Page<Environment> getEnvironmentByFilters(String name, String orderBy, boolean isOrderDesc, Pageable pageable) {
        Sort sort = isOrderDesc ? Sort.by(orderBy).descending() : Sort.by(orderBy).ascending();
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        
        return repository.findByFilters(name, sortedPageable);
    }


    public Environment save(Environment environment) {
        return repository.save(environment);
    }

    public boolean deleteByName(String name) {
        Optional<Environment> opt = repository.findByType(name);
        if (opt.isPresent()) {
            repository.delete(opt.get());
            return true;
        }
        return false;
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

	
}
