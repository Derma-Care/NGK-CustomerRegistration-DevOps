package com.glowkart.customer.feign;

import com.glowkart.customer.dto.AvailableSlotsResponse;
import com.glowkart.customer.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "clinicadmin-service", contextId = "clinicSlotsClient",url = "http://35.154.152.61:8080")
public interface ClinicSlotClient {

    @GetMapping("/clinic-admin/available-slots")
    ApiResponse<AvailableSlotsResponse> getAvailableSlots(
            @RequestParam String clinicId
    );
}
