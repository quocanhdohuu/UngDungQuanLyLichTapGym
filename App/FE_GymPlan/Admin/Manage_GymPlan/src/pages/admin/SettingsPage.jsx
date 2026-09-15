import { useState } from "react";

function SettingsIcon({ name }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
  const paths = {
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.8-2.8.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.8 2.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    warning: (
      <>
        <path d="m12 3 9 17H3L12 3Z" />
        <path d="M12 9v4M12 16h.01" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    cloud: (
      <>
        <path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 11a4 4 0 0 1 0 8H7Z" />
      </>
    ),
    api: (
      <>
        <path d="M8 8 4 12l4 4M16 8l4 4-4 4M14 5l-4 14" />
      </>
    ),
    health: (
      <>
        <path d="M20 8c0 5-8 10-8 10S4 13 4 8a4 4 0 0 1 7-2 4 4 0 0 1 7 2Z" />
        <path d="M8 10h2l1-2 2 5 1-3h2" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5M12 7v5l3 2" />
      </>
    ),
    save: (
      <>
        <path d="M5 4h12l2 2v14H5z" />
        <path d="M8 4v6h8V4M9 20v-5h6v5" />
      </>
    ),
  };
  return <svg {...props}>{paths[name] || paths.settings}</svg>;
}

function SettingsToggle({ on, onChange }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span />
    </button>
  );
}

function SettingsCard({
  icon,
  title,
  description,
  badge,
  children,
  className = "",
}) {
  return (
    <section className={`settings-card ${className}`}>
      <div className="settings-card-heading">
        <span className="settings-card-icon">
          <SettingsIcon name={icon} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="settings-card-badge">{badge}</span>
      </div>
      {children}
    </section>
  );
}

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("Tổng quan & Vận hành");
  const [maintenance, setMaintenance] = useState(false);
  const [autoTimer, setAutoTimer] = useState(true);
  const [notifications, setNotifications] = useState([true, true, true, true]);
  const [restTime, setRestTime] = useState(60);
  const [weightUnit, setWeightUnit] = useState("KG");
  const [distanceUnit, setDistanceUnit] = useState("KM");
  const [saved, setSaved] = useState(false);
  const tabs = [
    "Tổng quan & Vận hành",
    "Thông báo & Lời nhắc",
    "Tích hợp dịch vụ (API)",
    "Phân quyền Admin",
  ];

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div>
          <div className="settings-breadcrumb">
            <span>Home</span>
            <b>/</b>
            <span>Cấu hình</span>
            <b>/</b>
            <strong>Cấu hình hệ thống</strong>
          </div>
          <h1>Cấu hình hệ thống</h1>
          <p>
            Thiết lập thông số vận hành, quy tắc tập luyện, dịch vụ thông báo và
            tích hợp bên thứ ba.
          </p>
        </div>
        <div className="settings-status">
          <div className="settings-sync">
            <span>✓</span>
            <div>
              <strong>Đồng bộ thành công</strong>
              <small>Cấu hình đã được lưu trên toàn cụm máy chủ.</small>
            </div>
            <b>×</b>
          </div>
          <div className="settings-cluster">
            <i />{" "}
            <div>
              <strong>MASTER CLUSTER</strong>
              <small>SGP1-Node-Alpha (Live)</small>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
            key={tab}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="settings-grid">
        <div className="settings-column">
          <SettingsCard
            icon="settings"
            title="Thông tin ứng dụng"
            description="Định danh nền tảng & thông tin liên lạc khách hàng"
            badge="Production"
          >
            <div className="settings-fields">
              <div>
                <label>TÊN ỨNG DỤNG</label>
                <strong>
                  GYMFORLIFE <SettingsIcon name="copy" />
                </strong>
              </div>
              <div>
                <label>PHIÊN BẢN HIỆN TẠI</label>
                <strong>
                  v2.4.0 <em>Latest Stable</em>
                </strong>
                <small>(Build 2024.01.15)</small>
              </div>
              <div>
                <label>EMAIL HỖ TRỢ KỸ THUẬT</label>
                <strong>support@gymforlife.vn</strong>
              </div>
              <div>
                <label>HOTLINE</label>
                <strong>1900 8899</strong>
              </div>
              <div className="settings-full">
                <label>
                  MÚI GIỜ HỆ THỐNG <SettingsIcon name="clock" />
                </label>
                <strong>(GMT+07:00) Bangkok, Hanoi, Jakarta</strong>
              </div>
            </div>
            <div className="settings-inline-toggle">
              <span className="settings-mini-icon">
                <SettingsIcon name="settings" />
              </span>
              <div>
                <strong>Chế độ bảo trì hệ thống</strong>
                <small>Chỉ cho phép Super Admin truy cập khi kích hoạt</small>
              </div>
              <SettingsToggle on={maintenance} onChange={setMaintenance} />
            </div>
          </SettingsCard>

          <SettingsCard
            icon="bell"
            title="Hệ thống thông báo & Lời nhắc"
            description="Ma trận kích hoạt thông báo đa kênh & động lực người tập"
            badge="Push & In-App"
            className="settings-notification-card"
          >
            <div className="settings-notifications">
              {[
                [
                  "Lời nhắc giờ tập hàng ngày",
                  "(Daily Reminder)",
                  "Nhắc nhở qua Push Notification theo lịch đã lên",
                  "GIỜ: 18:00",
                ],
                [
                  "Thông báo đạt Kỷ lục cá nhân",
                  "(PR Celebration)",
                  "Kích hoạt hiệu ứng visual neon haptic & chia sẻ bảng tin",
                  "Gamified",
                ],
                [
                  "Báo cáo tiến độ & Volume hàng tuần",
                  "",
                  "Tóm tắt tổng khối lượng nâng (Tonnes) và nhóm cơ phát triển",
                  "Sáng Chủ Nhật",
                ],
                [
                  "Thông báo cập nhật hệ thống & phiên bản",
                  "",
                  "Thông báo bảo trì định kỳ và tính năng tập luyện mới",
                  "",
                ],
              ].map(([title, sub, desc, tag], index) => (
                <div className="settings-notification" key={title}>
                  <span className={`settings-notification-icon n${index}`}>
                    <SettingsIcon
                      name={
                        index === 1 ? "warning" : index === 2 ? "api" : "bell"
                      }
                    />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <small>{sub}</small>
                    <p>{desc}</p>
                  </div>
                  {tag && <em>{tag}</em>}
                  <SettingsToggle
                    on={notifications[index]}
                    onChange={(value) =>
                      setNotifications((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? value : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <div className="settings-health">
              <span />
              Độ trễ trung bình: 42ms <b>FCM & APNs Service Healthy</b>
            </div>
          </SettingsCard>
        </div>

        <div className="settings-column">
          <SettingsCard
            icon="settings"
            title="Quy tắc tập luyện"
            description="Tham số điều khiển cỗ máy tính toán tải lực & nhịp độ"
            badge="ENGINE V1.8"
            className="settings-rules-card"
          >
            <div className="settings-rule-grid">
              <div className="settings-rule">
                <label>THỜI GIAN NGHỈ MẶC ĐỊNH</label>
                <div className="settings-stepper">
                  <button
                    type="button"
                    onClick={() => setRestTime(Math.max(15, restTime - 15))}
                  >
                    −
                  </button>
                  <strong>
                    {restTime}
                    <small>GIÂY</small>
                  </strong>
                  <button
                    type="button"
                    onClick={() => setRestTime(restTime + 15)}
                  >
                    +
                  </button>
                </div>
                <small>Khoảng thay đổi: ±15 giây</small>
              </div>
              <div className="settings-rule">
                <label>GIỚI HẠN RPE CẢNH BÁO</label>
                <div className="settings-rpe">
                  <em>High Load</em>
                  <strong>RPE 9.5</strong>
                  <SettingsIcon name="warning" />
                </div>
                <small>Kích hoạt cảnh báo quá tải thần kinh cơ</small>
              </div>
              <div className="settings-rule">
                <label>ĐƠN VỊ KHỐI LƯỢNG TẠ</label>
                <div className="settings-choice">
                  {["KG", "LBS"].map((unit) => (
                    <button
                      type="button"
                      className={weightUnit === unit ? "active" : ""}
                      onClick={() => setWeightUnit(unit)}
                      key={unit}
                    >
                      {weightUnit === unit && "✓ "}
                      {unit}
                      {unit === "KG" && <small>(Mặc định)</small>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-rule">
                <label>ĐƠN VỊ KHOẢNG CÁCH / CARDIO</label>
                <div className="settings-choice">
                  {["KM", "Miles"].map((unit) => (
                    <button
                      type="button"
                      className={distanceUnit === unit ? "active" : ""}
                      onClick={() => setDistanceUnit(unit)}
                      key={unit}
                    >
                      {distanceUnit === unit && "✓ "}
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="settings-inline-toggle settings-timer">
              <span className="settings-mini-icon">
                <SettingsIcon name="clock" />
              </span>
              <div>
                <strong>Tự động đếm giờ nghỉ (Auto-advance timer)</strong>
                <small>
                  Bắt đầu đồng hồ đếm lùi ngay khi đánh dấu hoàn thành Set
                </small>
              </div>
              <SettingsToggle on={autoTimer} onChange={setAutoTimer} />
            </div>
          </SettingsCard>

          <SettingsCard
            icon="api"
            title="Tích hợp hệ thống & Dịch vụ"
            description="Cổng kết nối hạ tầng máy chủ, bên thứ ba đối tác dữ liệu"
            badge="4 Services Live"
            className="settings-services-card"
          >
            <div className="settings-services">
              {[
                [
                  "Email Service",
                  "AWS SES / SendGrid Transactional Gateway",
                  "Đang kết nối",
                  "Độ hoàn tất giao phát: 99.98%",
                  "Xem logs API",
                  "api",
                ],
                [
                  "SMS OTP Service",
                  "Twilio / Brandname SMS Telco Gateway",
                  "Đang hoạt động",
                  "Số dư hạn ngạch: 45,000 SMS",
                  "+ Nạp thêm",
                  "bell",
                ],
                [
                  "Cloud Storage",
                  "Cloudflare R2 / AWS S3 (Video 4K & Ảnh form tập)",
                  "1.4 TB / 10 TB",
                  "",
                  "",
                  "cloud",
                ],
                [
                  "Health Sync API",
                  "Apple HealthKit & Google Health Connect",
                  "Kích hoạt",
                  "",
                  "",
                  "health",
                ],
              ].map(([title, desc, status, detail, link, icon]) => (
                <div className="settings-service" key={title}>
                  <span className="settings-service-icon">
                    <SettingsIcon name={icon} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                    {detail && <p>{detail}</p>}
                    {title === "Cloud Storage" && (
                      <i>
                        <em />
                      </i>
                    )}
                  </div>
                  <div className="settings-service-status">
                    <b>
                      <span />
                      {status}
                    </b>
                    {link && <a href="#service">{link}</a>}
                  </div>
                </div>
              ))}
            </div>
            <div className="settings-service-footer">
              Khóa mã hóa RSA-4096 kích hoạt <b>Cấu hình Webhooks →</b>
            </div>
          </SettingsCard>
        </div>
      </div>
      <div className="settings-save-bar">
        <div>
          <SettingsIcon name="history" />
          <span>
            Lần cập nhật cuối: Hôm nay lúc 14:32 bởi <b>Super Admin Quoc Anh</b>
          </span>
        </div>
        <button type="button">Khôi phục mặc định</button>
        <button
          type="button"
          className="settings-save"
          onClick={() => setSaved(true)}
        >
          <SettingsIcon name="save" />
          {saved ? "ĐÃ LƯU" : "LƯU CẤU HÌNH"}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
