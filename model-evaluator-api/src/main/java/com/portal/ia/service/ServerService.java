package com.portal.ia.service;

import com.portal.ia.entity.Server;
import com.portal.ia.repository.ServerRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;



@Service
public class ServerService {

    private final ServerRepository repository;

    public ServerService(ServerRepository repository) {
        this.repository = repository;
    }

    public List<Server> getAll() {
        return repository.findAll();
    }

    public Optional<Server> getById(Long id) {
        return repository.findById(id);
    }

    public Optional<Server> getByName(String name) {
        return repository.findByName(name);
    }

    public Page<Server> getServerByFilters(String name, String orderBy, boolean isOrderDesc, Pageable pageable) {
        Sort sort = isOrderDesc ? Sort.by(orderBy).descending() : Sort.by(orderBy).ascending();
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        
        return repository.findByFilters(name, sortedPageable);
    }


    public Server save(Server server) {
        return repository.save(server);
    }

    public boolean deleteByName(String name) {
        Optional<Server> opt = repository.findByName(name);
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
