package com.rentzy.backend.repository;

import com.rentzy.backend.domain.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {
    List<Listing> findByType(String type);
    List<Listing> findByLocationContainingIgnoreCase(String location);
    List<Listing> findByOwnerEmail(String email);

    @Query("SELECT l FROM Listing l WHERE " +
           "(:type = '' OR LOWER(l.type) = LOWER(:type)) AND " +
           "(:location = '' OR LOWER(l.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:minPrice = -1.0 OR l.price >= :minPrice) AND " +
           "(:maxPrice = -1.0 OR l.price <= :maxPrice) AND " +
           "(:configuration = '' OR l.configuration = :configuration) AND " +
           "(:furnishing = '' OR l.furnishing = :furnishing) " +
           "ORDER BY " +
           "CASE WHEN :sortBy = 'price_asc' THEN l.price END ASC, " +
           "CASE WHEN :sortBy = 'price_desc' THEN l.price END DESC, " +
           "l.id DESC")
    List<Listing> searchListings(@Param("type") String type, 
                                 @Param("location") String location,
                                 @Param("minPrice") Double minPrice,
                                 @Param("maxPrice") Double maxPrice,
                                 @Param("configuration") String configuration,
                                 @Param("furnishing") String furnishing,
                                 @Param("sortBy") String sortBy);
}
