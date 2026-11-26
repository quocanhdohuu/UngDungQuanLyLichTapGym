import torch
import torch.nn as nn
import torchvision.models as models

class MultiTaskNutritionNet(nn.Module):
    """
    Mô hình Multi-task Vision cho bài toán ước tính Dinh dưỡng:
    - Backbone: MobileNetV3-Small / ConvNeXt trích xuất đặc trưng hình ảnh
    - Head 1 (Classification): Dự đoán xác suất xuất hiện của K nguyên liệu (Multi-label)
    - Head 2 (Mass Regression): Dự đoán khối lượng (gram) tương ứng cho từng nguyên liệu
    """
    def __init__(self, num_classes: int = 49, pretrained: bool = True):
        super().__init__()
        self.num_classes = num_classes
        
        # Sử dụng MobileNetV3-Small làm backbone để tối ưu inference < 50ms trên CPU
        weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        backbone = models.mobilenet_v3_small(weights=weights)
        
        # Tách phần trích xuất đặc trưng
        self.features = backbone.features
        self.avgpool = backbone.avgpool
        in_features = backbone.classifier[0].in_features  # 576
        
        # Shared projection
        self.shared_fc = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.BatchNorm1d(256),
            nn.Hardswish(),
            nn.Dropout(p=0.2)
        )
        
        # Branch 1: Nhận diện nguyên liệu (Classification Logits)
        self.cls_head = nn.Linear(256, num_classes)
        
        # Branch 2: Hồi quy khối lượng (Mass Regression in Grams)
        self.mass_head = nn.Sequential(
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, num_classes),
            nn.ReLU() # Đảm bảo gram luôn không âm (>= 0)
        )

    def forward(self, x: torch.Tensor):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        feat = self.shared_fc(x)
        
        logits = self.cls_head(feat)
        mass_pred = self.mass_head(feat)
        
        return logits, mass_pred

class MaskedMultiTaskLoss(nn.Module):
    """
    Hàm mất mát tích hợp:
    L = L_BCE(logits, labels) + lambda * MaskedSmoothL1(mass_pred, target_mass)
    Chỉ tính loss hồi quy khối lượng trên các nguyên liệu THỰC SỰ CÓ MẶT (label = 1)
    """
    def __init__(self, mass_weight: float = 0.01):
        super().__init__()
        self.bce_loss = nn.BCEWithLogitsLoss()
        self.smooth_l1 = nn.SmoothL1Loss(reduction='none')
        self.mass_weight = mass_weight

    def forward(self, logits, mass_pred, target_labels, target_mass):
        cls_loss = self.bce_loss(logits, target_labels)
        
        # Masked Loss: chỉ tính loss gram cho các nguyên liệu xuất hiện trong suất ăn
        mask = (target_labels > 0.5).float()
        raw_mass_loss = self.smooth_l1(mass_pred, target_mass)
        masked_mass_loss = (raw_mass_loss * mask).sum() / (mask.sum() + 1e-6)
        
        total_loss = cls_loss + self.mass_weight * masked_mass_loss
        return total_loss, cls_loss, masked_mass_loss
