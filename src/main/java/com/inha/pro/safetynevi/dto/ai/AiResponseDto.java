package com.inha.pro.safetynevi.dto.ai;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiResponseDto {
    private String disasterType;
    private String safety;
    private double confidence;
}
