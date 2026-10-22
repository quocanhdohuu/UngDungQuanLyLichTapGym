const path = require("path");
const beDir = path.resolve(__dirname, "../App/BE_GymPlan");
const mysql = require(path.join(beDir, "node_modules/mysql2/promise"));
require(path.join(beDir, "node_modules/dotenv")).config({ path: path.join(beDir, ".env") });

const exercisesData = {
  1: {
    name: "Barbell Bench Press",
    instructions:
      "1. Nằm vững trên ghế phẳng, mắt nhìn thẳng dưới thanh đòn. Hai bàn chân đặt phẳng và bám chắc trên sàn, ưỡn ngực và siết chặt hai bả vai ra sau.\n" +
      "2. Nắm thanh đòn rộng hơn vai một chút, khóa ngón cái quanh thanh (full grip). Tháo đòn khỏi giá đỡ và giữ thẳng trên ngực, hít sâu gồng cứng cơ bụng.\n" +
      "3. Hạ thanh đòn chậm rãi và có kiểm soát xuống giữa ngực. Giữ cẳng tay vuông góc với sàn, khuỷu tay mở một góc 45-75 độ so với thân người.\n" +
      "4. Thở ra dứt khoát, dùng lực cơ ngực đẩy đòn thẳng lên vị trí ban đầu. Dừng lại khi cánh tay thẳng nhưng không khóa cứng khớp khuỷu.",
    cautions:
      "• Tuyệt đối không bạnh khuỷu tay vuông góc 90 độ sang hai bên vì sẽ chèn ép khớp vai và gây rách chóp xoay.\n" +
      "• Không nâng mông rời khỏi mặt ghế và không để thanh đòn nảy bật trên lồng ngực.\n" +
      "• Không sử dụng kiểu nắm không khóa ngón cái (suicide grip) để tránh nguy cơ trượt đòn rơi vào người.",
  },
  2: {
    name: "Barbell Squat",
    instructions:
      "1. Đặt thanh đòn trên giá ngang tầm ngực trên. Luồn người vào tựa đòn lên cơ cầu vai (High bar) hoặc cơ vai sau (Low bar), hai tay nắm chắc thanh đòn.\n" +
      "2. Bước lùi 2 bước nhỏ, đứng chân rộng bằng vai hoặc hơn một chút, mũi chân hơi chếch ra ngoài 15-30 độ. Hít sâu căng lồng ngực và gồng chặt khoang bụng (bracing).\n" +
      "3. Đẩy hông ra sau đồng thời gập đầu gối, hạ thấp trọng tâm có kiểm soát sao cho đùi song song với sàn (hoặc sâu hơn nếu khớp hông cho phép).\n" +
      "4. Giữ lưng dưới thẳng và ngực mở, đạp mạnh toàn bộ bàn chân xuống sàn để đứng thẳng dậy về vị trí ban đầu, thở ra ở 1/3 chặng cuối.",
    cautions:
      "• Không để đầu gối chụm vào nhau (knee valgus) khi đi xuống hoặc đẩy lên; luôn hướng đầu gối theo chiều mũi chân.\n" +
      "• Tuyệt đối giữ cột sống thẳng tự nhiên, không cong lưng dưới (butt wink quá mức) để tránh tổn thương đĩa đệm.\n" +
      "• Không nhấc gót chân lên khỏi mặt sàn trong suốt quá trình chuyển động.",
  },
  3: {
    name: "Deadlift",
    instructions:
      "1. Đứng chân rộng bằng hông, thanh đòn cắt ngang giữa bàn chân (cách ống chân 2-3 cm). Mũi chân thẳng hoặc hơi mở nhẹ.\n" +
      "2. Đẩy hông ra sau và cúi xuống nắm chặt thanh đòn ngay sát ngoài hai đầu gối. Ống chân tiến sát chạm nhẹ vào đòn.\n" +
      "3. Hạ bả vai, siết cơ xô, mở ngực và hít sâu gồng cứng bụng để kéo căng độ rơ của thanh đòn (pull the slack).\n" +
      "4. Đạp mạnh sàn như đang đẩy mặt đất ra xa, mở hông và đầu gối đồng thời để đưa tạ lên sát thân người; khóa hông ở đỉnh và hạ tạ xuống có kiểm soát.",
    cautions:
      "• Tuyệt đối không cong lưng (đặc biệt lưng dưới) ở bất kỳ giai đoạn nào; giữ cột sống luôn ở trạng thái trung tính.\n" +
      "• Giữ thanh đòn trượt sát ống chân và đùi, không để đòn đi xa khỏi trọng tâm cơ thể.\n" +
      "• Không ngửa người quá mức (hyperextension) ra sau tại đỉnh chuyển động.",
  },
  4: {
    name: "Lat Pulldown",
    instructions:
      "1. Ngồi vào máy kéo cáp, điều chỉnh đệm chèn đùi vừa vặn để giữ cố định thân dưới. Nắm tay cầm rộng hơn vai.\n" +
      "2. Hơi ngả người về sau khoảng 10-15 độ, ưỡn ngực và chủ động kéo hạ bả vai xuống để kích hoạt cơ xô.\n" +
      "3. Thở ra, kéo thanh đòn xuống chạm nhẹ vào phần ngực trên bằng cách ghì cùi chỏ hướng xuống sàn và hơi ép vào trong.\n" +
      "4. Hít vào, từ từ duỗi tay có kiểm soát đưa thanh đòn trở lại vị trí cơ xô được kéo giãn tối đa.",
    cautions:
      "• Không dùng đà cả thân người lắc lư ra sau để giật tạ xuống.\n" +
      "• Không kéo thanh đòn ra sau cổ vì gây tổn thương khớp vai và đốt sống cổ.\n" +
      "• Tập trung cảm nhận kéo bằng cùi chỏ, tránh dùng lực cẳng tay và bóp quá chặt tay cầm.",
  },
  5: {
    name: "Dumbbell Shoulder Press",
    instructions:
      "1. Ngồi thẳng lưng trên ghế có tựa lưng vuông góc (hoặc chếch nhẹ 75-80 độ). Cầm 2 tạ đơn đặt trên đùi, dùng đầu gối hất tạ lên ngang tầm vai.\n" +
      "2. Cẳng tay vuông góc với sàn, lòng bàn tay hướng về phía trước, cùi chỏ hơi chếch vào trong khoảng 30-45 độ (mặt phẳng scapular plane).\n" +
      "3. Hít một hơi siết cơ bụng, thở ra và đẩy mạnh hai tạ đơn lên cao qua đầu theo đường vòng cung nhẹ, không chạm tạ vào nhau.\n" +
      "4. Hít vào, từ từ hạ tạ xuống có kiểm soát về ngang tầm cằm hoặc vai rồi tiếp tục lần lặp kế tiếp.",
    cautions:
      "• Không bạnh cùi chỏ 90 độ sang hai bên vì sẽ gây cấn khớp vai (shoulder impingement).\n" +
      "• Không ưỡn thắt lưng quá đà rời khỏi đệm ghế để đẩy tạ nặng.\n" +
      "• Kiểm soát tạ khi hạ xuống, tránh để tạ rơi tự do gây chấn thương khớp vai.",
  },
  6: {
    name: "Latteral Raise",
    instructions:
      "1. Đứng thẳng, hai chân rộng bằng vai, cầm tạ đơn hai bên đùi. Thân người hơi đổ nhẹ về trước khoảng 5-10 độ, cùi chỏ hơi cong tự nhiên.\n" +
      "2. Giữ cố định khớp khuỷu tay, thở ra và nâng hai cánh tay sang ngang hai bên cơ thể.\n" +
      "3. Nâng đến khi khuỷu tay ngang tầm vai, cổ tay và cùi chỏ nằm trên cùng mặt phẳng (cùi chỏ dẫn đầu chuyển động).\n" +
      "4. Hít vào, hạ tạ từ từ có kiểm soát trong 2-3 giây về vị trí ban đầu trước khi bắt đầu lần lặp mới.",
    cautions:
      "• Không vung vẩy người, nhún gối hoặc dùng đà hông để văng tạ lên.\n" +
      "• Không nhún cơ cầu vai (traps) lên tai; luôn giữ vai ghì xuống để lực dồn trọn vào cơ vai giữa.\n" +
      "• Không nâng tạ vượt quá tầm vai vì làm tăng ma sát khớp vai.",
  },
  7: {
    name: "Incline Barbell Bench Press",
    instructions:
      "1. Chỉnh ghế dốc góc 30-45 độ. Nằm áp sát lưng và đầu vào đệm, chân bám chắc trên sàn, khép nhẹ bả vai ra sau.\n" +
      "2. Nắm đòn rộng hơn vai, nhấc đòn ra khỏi giá đỡ và giữ cố định trên phần ngực trên.\n" +
      "3. Hít sâu gồng cơ bụng, hạ thanh đòn chậm rãi chạm nhẹ vào phần xương quai xanh hoặc ngực trên, cùi chỏ tạo góc 45-60 độ so với thân.\n" +
      "4. Thở ra dứt khoát, dùng lực ngực trên đẩy thanh đòn thẳng lên về vị trí ban đầu mà không khóa gắt khớp cùi chỏ.",
    cautions:
      "• Không chỉnh ghế dốc quá 45 độ vì lực sẽ chuyển sang cơ vai trước thay vì ngực trên.\n" +
      "• Không hạ thanh đòn xuống quá thấp ở vùng cổ họng.\n" +
      "• Luôn có người hỗ trợ (spotter) hoặc dùng thanh chặn an toàn khi tập mức tạ nặng.",
  },
  8: {
    name: "Incline Dumbbell Press",
    instructions:
      "1. Ghế nghiêng góc 30-45 độ. Cầm tạ đơn trên đùi, dùng đầu gối hất từng quả tạ lên ngang ngực khi ngả lưng vào ghế.\n" +
      "2. Ép bả vai, mở ngực, bàn chân bám sàn, cùi chỏ mở góc 45-60 độ so với thân người.\n" +
      "3. Thở ra, đẩy tạ đơn lên cao theo hướng hơi hội tụ ở trên ngực nhưng không đập tạ vào nhau.\n" +
      "4. Hít vào, hạ tạ chậm rãi sâu vừa phải để kéo giãn cơ ngực trên mà không gây đau khớp vai.",
    cautions:
      "• Không để tạ rơi quá sâu khiến khuỷu tay tụt sâu ra sau mặt phẳng ghế gây kéo căng khớp vai quá mức.\n" +
      "• Luôn duy trì cổ tay thẳng, không để tạ bẻ gập cổ tay ra sau.\n" +
      "• Giữ lưng dưới hơi cong tự nhiên, không ưỡn cong người quá đà.",
  },
  9: {
    name: "Dumbbell Bench Press",
    instructions:
      "1. Ngồi ở mép ghế phẳng, đặt hai quả tạ đơn dựng đứng trên đùi. Ngả người nằm xuống đồng thời dùng đùi đưa tạ lên vị trí chuẩn bị ngang ngực.\n" +
      "2. Đặt chân vững chắc trên sàn, khép bả vai, cẳng tay giữ vuông góc với mặt sàn.\n" +
      "3. Thở ra, đẩy hai quả tạ thẳng lên cao trên ngực theo đường cong hơi hội tụ nhẹ.\n" +
      "4. Hít vào, hạ tạ có kiểm soát xuống hai bên ngực cho đến khi cảm nhận cơ ngực căng vừa phải.",
    cautions:
      "• Không để tạ đơn va chạm mạnh vào nhau ở đỉnh chuyển động làm mất lực căng cơ.\n" +
      "• Tránh để cùi chỏ bạnh ngang 90 độ.\n" +
      "• Khi tập xong, hạ tạ trở lại đùi hoặc đặt có kiểm soát, tránh ném tạ nguy hiểm.",
  },
  10: {
    name: "Chest Press Machine",
    instructions:
      "1. Chỉnh độ cao ghế ngồi sao cho tay cầm ngang tầm giữa ngực dưới hoặc giữa ngực.\n" +
      "2. Ngồi sát lưng và đầu vào tựa ghế, hai chân bám phẳng trên sàn, khép bả vai và ưỡn ngực.\n" +
      "3. Thở ra, đẩy tay cầm về phía trước cho đến khi cánh tay duỗi gần thẳng (không khóa khớp khuỷu).\n" +
      "4. Hít vào, từ từ nhả tay cầm trở lại vị trí ban đầu trong khi vẫn giữ lồng ngực mở căng.",
    cautions:
      "• Không nhổm vai hoặc đẩy bả vai về phía trước ở điểm đẩy xa nhất.\n" +
      "• Không để tạ rơi va mạnh vào cọc tạ giữa các lần lặp.\n" +
      "• Giữ lưng dưới áp sát hoặc duy trì độ cong sinh lý tự nhiên với tựa ghế.",
  },
  11: {
    name: "Cable Fly",
    instructions:
      "1. Đứng ở giữa giàn kéo cáp hai bên, ròng rọc chỉnh ngang tầm ngực hoặc cao hơn vai. Bước 1 chân lên trước để tạo thế đứng vững chắc.\n" +
      "2. Hai tay nắm tay cầm cáp, cùi chỏ hơi cong nhẹ và giữ cố định góc cong này trong suốt bài tập.\n" +
      "3. Thở ra, ép hai tay về phía trước ngực theo đường vòng cung lớn như đang ôm một thân cây to.\n" +
      "4. Hít vào, mở hai cánh tay ra sau chậm rãi để cơ ngực được kéo căng tối đa trước khi thực hiện lần lặp tiếp theo.",
    cautions:
      "• Không thay đổi góc co của khớp khuỷu tay biến bài ép ngực thành bài đẩy ngực.\n" +
      "• Không duỗi cánh tay ra quá xa về sau làm khớp vai bị căng thẳng quá mức.\n" +
      "• Giữ thân người ổn định, không đung đưa thân trên để tạo đà.",
  },
  12: {
    name: "Pec Deck Fly",
    instructions:
      "1. Ngồi tựa sát lưng vào ghế máy Pec Deck, chỉnh đệm ghế sao cho tay cầm hoặc đệm tỳ cẳng tay ngang tầm ngực.\n" +
      "2. Nắm tay cầm, giữ cùi chỏ hơi cong nhẹ và ngang tầm ngực, mở ngực và siết bả vai ra sau.\n" +
      "3. Thở ra, dùng cơ ngực ép hai tay vào nhau trước mặt, giữ co cơ cực đại trong 1 giây.\n" +
      "4. Hít vào, kiểm soát mở hai tay chậm rãi sang hai bên cho đến khi ngực căng vừa phải.",
    cautions:
      "• Không để cánh tay mở quá sâu về sau vượt qua mặt phẳng vai gây áp lực lớn lên khớp vai.\n" +
      "• Không nhấc bả vai hoặc rụt cổ khi ép tạ vào nhau.\n" +
      "• Không để các tấm tạ va chạm mạnh vào nhau khi mở tay ra.",
  },
  13: {
    name: "Push Up",
    instructions:
      "1. Vào tư thế plank cao: hai bàn tay đặt trên sàn rộng hơn vai một chút, các ngón tay xòe nhẹ, mũi chân chống sàn.\n" +
      "2. Giữ toàn bộ cơ thể từ đầu, lưng, mông đến gót chân thành một đường thẳng tắp, siết chặt cơ bụng và cơ mông.\n" +
      "3. Hít vào, hạ thấp cơ thể có kiểm soát cho đến khi ngực cách mặt sàn khoảng 2-3 cm, cùi chỏ tạo góc 45 độ so với thân.\n" +
      "4. Thở ra, dùng cơ ngực và cơ tay sau đẩy mạnh cơ thể trở lại vị trí ban đầu.",
    cautions:
      "• Không để võng lưng dưới hoặc nhô mông lên quá cao.\n" +
      "• Tránh để cùi chỏ bạnh rộng 90 độ sang hai bên vì sẽ gây mỏi và đau khớp vai.\n" +
      "• Không gập cổ nhìn lên trần nhà hoặc cúi đầu; giữ cổ thẳng tự nhiên với cột sống.",
  },
  14: {
    name: "Pull Up",
    instructions:
      "1. Bật nhảy hoặc với nắm thanh xà đơn với lòng bàn tay hướng ra ngoài (overhand grip), khoảng cách tay rộng hơn vai.\n" +
      "2. Treo người tự do, kéo hạ bả vai xuống (scapular depression) và siết chặt cơ bụng, gập nhẹ đầu gối nếu xà thấp.\n" +
      "3. Thở ra, dùng cơ xô kéo toàn bộ cơ thể lên sao cho cằm vượt qua thanh xà, tập trung ghì cùi chỏ xuống sàn.\n" +
      "4. Hít vào, hạ người xuống từ từ có kiểm soát cho đến khi cánh tay duỗi hoàn toàn về vị trí ban đầu.",
    cautions:
      "• Không đung đưa người hoặc đá chân tạo đà (kipping) nếu đang tập pull-up chuẩn sức mạnh cô lập cơ.\n" +
      "• Không rụt cổ hoặc cố ngửa cằm rướn lên xà khi chưa đủ biên độ kéo của cơ lưng.\n" +
      "• Hạ người có kiểm soát, tránh thả rơi tự do làm giật khớp vai và khuỷu tay.",
  },
  15: {
    name: "Chin Up",
    instructions:
      "1. Nắm thanh xà đơn với lòng bàn tay hướng vào người (underhand grip), hai tay rộng bằng vai.\n" +
      "2. Thả lỏng cánh tay vào vị trí treo người hoàn toàn, siết chặt cơ bụng và kéo nhẹ bả vai ra sau.\n" +
      "3. Thở ra, kéo cơ thể lên thẳng đứng cho đến khi cằm vượt qua thanh xà, tập trung cảm nhận sự kích hoạt mạnh của cơ bắp tay trước và xô dưới.\n" +
      "4. Hít vào, từ từ hạ cơ thể xuống theo kiểm soát trong 2-3 giây cho đến khi cánh tay duỗi thẳng hoàn toàn.",
    cautions:
      "• Không vặn vẹo thân người hoặc gập gối giật đà để kéo người lên.\n" +
      "• Không thả rơi đột ngột ở đáy chuyển động để tránh chấn thương gân cơ bắp tay trước.\n" +
      "• Khởi động kỹ khớp cổ tay và khuỷu tay trước khi tập bài này.",
  },
  16: {
    name: "Barbell Bent Over Row",
    instructions:
      "1. Đứng chân rộng bằng hông, thanh đòn sát ống chân. Cúi gập hông nắm thanh đòn rộng hơn vai một chút (úp hoặc ngửa tay).\n" +
      "2. Đẩy hông ra sau, gập thân người về trước tạo góc 45-60 độ so với phương thẳng đứng, giữ lưng dưới thẳng tắp, đầu gối hơi chùng.\n" +
      "3. Hít sâu gồng bụng, thở ra và kéo thanh đòn thẳng lên chạm vào vùng bụng dưới/rốn, kéo bằng cùi chỏ và ép chặt bả vai ở đỉnh.\n" +
      "4. Hít vào, hạ thanh đòn chậm rãi về vị trí cánh tay duỗi thẳng nhưng không thả lỏng cơ lưng.",
    cautions:
      "• Tuyệt đối không cong lưng dưới khi kéo tạ vì áp lực lên thắt lưng rất lớn.\n" +
      "• Không giật đà toàn thân đứng thẳng lên để kéo tạ nặng.\n" +
      "• Giữ đầu và cổ thẳng hàng với sống lưng, không ngửa cổ nhìn thẳng lên gương.",
  },
  17: {
    name: "Dumbbell Row",
    instructions:
      "1. Đặt gối trái và tay trái chống vững chắc trên ghế phẳng, chân phải chống trên sàn hơi lùi về sau để tạo thế kiềng 3 chân vững.\n" +
      "2. Tay phải cầm tạ đơn buông thẳng xuống sàn, giữ lưng thẳng song song hoặc nghiêng nhẹ so với mặt ghế.\n" +
      "3. Thở ra, kéo tạ đơn lên theo quỹ đạo hình vòng cung nhẹ về phía hông phải, cùi chỏ ép sát thân người và bả vai siết chặt.\n" +
      "4. Hít vào, hạ tạ từ từ có kiểm soát xuống vị trí kéo giãn cơ xô rồi thực hiện lại.",
    cautions:
      "• Không xoay vặn thân trên khi kéo tạ lên để tránh vặn xoắn cột sống thắt lưng.\n" +
      "• Không kéo tạ thẳng lên ngực trên làm ăn vào cơ vai trước thay vì cơ xô.\n" +
      "• Giữ cổ trung tính, không cúi gục đầu hoặc ngửa đầu quá mức.",
  },
  18: {
    name: "Seated Cable Row",
    instructions:
      "1. Ngồi vào máy kéo cáp ngang, đặt hai chân lên bàn đạp, đầu gối hơi chùng nhẹ. Nắm tay cầm chữ V.\n" +
      "2. Đẩy người ra sau để nhấc tạ, giữ thân người vuông góc với sàn, ưỡn ngực và giữ thẳng lưng dưới.\n" +
      "3. Thở ra, kéo tay cầm về phía bụng dưới, ép hai bả vai vào nhau và đưa cùi chỏ ra sau thân người.\n" +
      "4. Hít vào, từ từ nhả tay cầm về phía trước có kiểm soát, cho phép bả vai mở nhẹ để kéo giãn cơ xô nhưng không cong gập lưng.",
    cautions:
      "• Không đung đưa người ra trước và sau quá nhiều để lấy đà kéo tạ.\n" +
      "• Không khóa cứng khớp gối trong suốt bài tập.\n" +
      "• Giữ vai luôn hạ thấp, tránh rụt vai lên tai.",
  },
  19: {
    name: "T-Bar Row",
    instructions:
      "1. Đứng dạng hai chân sang hai bên thanh đòn T-Bar, bàn chân bám chắc trên sàn. Gập hông cúi người về trước tạo góc 45 độ, lưng thẳng.\n" +
      "2. Hai tay nắm chắc tay cầm, đầu gối chùng nhẹ, siết chặt cơ bụng và cơ dựng sống lưng.\n" +
      "3. Thở ra, dùng cơ lưng giữa và xô kéo tạ lên sát ngực/bụng trên, ép chặt hai bả vai tại điểm co cơ cực đại.\n" +
      "4. Hít vào, hạ tạ chậm rãi trở lại vị trí cánh tay duỗi thẳng mà vẫn duy trì độ căng của cơ lưng.",
    cautions:
      "• Nguy cơ chấn thương thắt lưng cao nếu cong lưng; luôn giữ cột sống thẳng và core gồng cứng.\n" +
      "• Không giật đà đứng thẳng người dậy để nhấc tạ nặng.\n" +
      "• Chọn mức tạ vừa sức để kiểm soát biên độ chuyển động đầy đủ.",
  },
  20: {
    name: "Straight Arm Pulldown",
    instructions:
      "1. Đứng trước máy kéo cáp cao, lắp thanh đòn thẳng hoặc dây thừng. Đứng chân rộng bằng vai, gập nhẹ hông về trước 15-20 độ.\n" +
      "2. Hai tay nắm thanh đòn rộng bằng vai, cánh tay duỗi gần thẳng (chỉ hơi chùng nhẹ khớp khuỷu để bảo vệ khớp).\n" +
      "3. Thở ra, ghì cánh tay xuống theo hình vòng cung lớn đưa thanh đòn về chạm đùi trước, tập trung toàn bộ lực vào cơ xô.\n" +
      "4. Hít vào, đưa thanh đòn trở lại chậm rãi ngang tầm mắt hoặc trán để cơ xô được kéo giãn hết cỡ.",
    cautions:
      "• Không gập khuỷu tay biến động tác thành bài triceps pushdown của cơ tay sau.\n" +
      "• Giữ thân người cố định, không dùng quán tính dập người xuống để ép tạ.\n" +
      "• Cổ tay luôn thẳng hàng với cẳng tay.",
  },
  21: {
    name: "Face Pull",
    instructions:
      "1. Chỉnh ròng rọc cáp ngang tầm mắt hoặc ngực trên, gắn dây thừng (rope attachment). Cầm hai đầu dây thừng với ngón cái hướng về phía mình.\n" +
      "2. Bước lùi lại 1-2 bước để nhấc tạ, chân trước chân sau vững chãi, siết chặt cơ bụng và mở ngực.\n" +
      "3. Thở ra, kéo dây thừng thẳng về phía trán và hai bên mắt, đồng thời xoay cẳng tay ra sau sao cho cùi chỏ nâng cao ngang vai.\n" +
      "4. Ép chặt cơ vai sau và lưng trên trong 1 giây, sau đó hít vào nhả dây về vị trí ban đầu có kiểm soát.",
    cautions:
      "• Không để cùi chỏ hạ thấp dưới tầm vai vì sẽ mất tác động vào cơ vai sau và cơ chóp xoay.\n" +
      "• Không ngả người giật đà ra sau.\n" +
      "• Đây là bài tập sức khỏe khớp vai và cơ nhỏ, ưu tiên kỹ thuật chuẩn và số lần lặp cao hơn là nâng quá nặng.",
  },
  22: {
    name: "Barbell Overhead Press",
    instructions:
      "1. Đứng thẳng, hai chân rộng bằng vai, đặt thanh đòn trên xương quai xanh và phần ngực trên. Nắm đòn rộng hơn vai một chút, cẳng tay vuông góc với sàn.\n" +
      "2. Siết chặt cơ mông, đùi trước và gồng cứng cơ bụng để tạo một bệ đỡ cơ thể vững chắc như trụ đá.\n" +
      "3. Thở ra, hơi ngửa đầu nhẹ về sau để đòn vượt qua cằm, sau đó đẩy đòn thẳng đứng lên trên đầu.\n" +
      "4. Khi đòn qua đỉnh đầu, đưa đầu về vị trí tự nhiên và khóa đòn thẳng trên xương bả vai; hít vào hạ tạ có kiểm soát xuống ngực.",
    cautions:
      "• Tuyệt đối không ưỡn thắt lưng ra sau quá mức để đẩy tạ vì dễ gây chấn thương cột sống lưng dưới.\n" +
      "• Không dùng lực nhún gối tạo đà (nếu tập OHP nghiêm ngặt Strict Press).\n" +
      "• Luôn giữ thanh đòn di chuyển theo đường thẳng đứng gần mặt nhất có thể.",
  },
  23: {
    name: "Arnold Press",
    instructions:
      "1. Ngồi thẳng lưng trên ghế có tựa, giữ 2 tạ đơn trước ngực ngang cằm, lòng bàn tay hướng vào thân người (như vị trí đỉnh của bicep curl).\n" +
      "2. Hít vào siết cơ bụng, bắt đầu đẩy tạ lên đồng thời xoay cánh tay ra ngoài sao cho lòng bàn tay hướng về phía trước khi tạ qua khỏi đầu.\n" +
      "3. Thở ra và kết thúc ở vị trí tạ thẳng trên đầu với cánh tay gần thẳng hoàn toàn.\n" +
      "4. Hít vào, hạ tạ xuống và từ từ xoay cánh tay ngược lại về tư thế ban đầu trước ngực.",
    cautions:
      "• Xoay tay nhịp nhàng theo tiến trình nâng tạ, không xoay giật cục ở đáy hoặc đỉnh.\n" +
      "• Sử dụng mức tạ nhẹ hơn bài đẩy vai thông thường vì động tác yêu cầu chuyển động phức hợp nhiều mặt phẳng.\n" +
      "• Không ưỡn lưng dưới ra khỏi ghế tựa.",
  },
  24: {
    name: "Machine Shoulder Press",
    instructions:
      "1. Điều chỉnh ghế ngồi sao cho tay cầm ngang tầm vai hoặc ngay trên vai một chút.\n" +
      "2. Ngồi sát lưng và đầu vào tựa ghế, hai chân bám chắc trên sàn, cầm chắc tay nắm máy.\n" +
      "3. Thở ra, đẩy tay cầm lên thẳng đứng qua đầu đến khi cánh tay duỗi gần thẳng (không khóa cứng khớp khuỷu).\n" +
      "4. Hít vào, hạ tay cầm xuống chậm rãi về ngang tầm tai/vai rồi tiếp tục lần lặp tiếp theo.",
    cautions:
      "• Không nâng mông hoặc ưỡn lưng cong khỏi ghế.\n" +
      "• Tránh để tạ chạm cọc gây mất lực căng trên cơ vai giữa các lần lặp.\n" +
      "• Điều chỉnh độ cao ghế chuẩn trước khi tập để tránh cấn khớp vai ở vị trí bắt đầu.",
  },
  25: {
    name: "Cable Lateral Raise",
    instructions:
      "1. Đứng cạnh máy kéo cáp, ròng rọc hạ xuống vị trí thấp nhất. Tay xa máy với qua thân người nắm tay cầm chữ D.\n" +
      "2. Đứng thẳng hoặc hơi nghiêng người ra xa cột cáp một chút để tăng lực căng, cùi chỏ giữ hơi cong nhẹ cố định.\n" +
      "3. Thở ra, nâng cánh tay sang ngang theo hình vòng cung cho đến khi tay song song với sàn (ngang tầm vai).\n" +
      "4. Dừng lại cảm nhận cơ vai giữa co bóp trong 1 giây, sau đó hít vào và hạ tạ chậm rãi trong 2-3 giây.",
    cautions:
      "• Không dùng đà thân người đung đưa để giật cáp lên.\n" +
      "• Không nâng tạ vượt quá độ cao của vai.\n" +
      "• Giữ cổ tay thẳng, không xoay cổ tay ngửa lên trời làm ăn vào cơ vai trước.",
  },
  26: {
    name: "Reverse Pec Deck",
    instructions:
      "1. Chỉnh ghế máy Pec Deck sao cho tay cầm ngang tầm vai khi ngồi đối diện hướng mặt vào đệm ghế.\n" +
      "2. Ngực áp sát vào đệm, hai chân bám chắc trên sàn, hai tay nắm tay cầm với cùi chỏ hơi cong nhẹ.\n" +
      "3. Thở ra, dùng cơ vai sau mở hai cánh tay ra sau theo chiều ngang cho đến khi cánh tay thẳng hàng với vai.\n" +
      "4. Siết chặt vai sau trong 1 giây, hít vào rồi từ từ đưa hai tay về phía trước có kiểm soát.",
    cautions:
      "• Không để ngực rời khỏi đệm tựa khi mở tạ ra sau.\n" +
      "• Không nhún vai lên tai; tập trung cảm nhận chuyển động mở của khớp vai sau.\n" +
      "• Giữ nguyên độ cong nhẹ của khuỷu tay trong suốt quá trình tập.",
  },
  27: {
    name: "Rear Delt Fly",
    instructions:
      "1. Ngồi ở mép ghế phẳng, gập người về phía trước sao cho ngực áp gần sát đùi, hai tay cầm tạ đơn phía dưới cẳng chân.\n" +
      "2. Cùi chỏ hơi cong nhẹ, lòng bàn tay hướng vào nhau, cổ giữ thẳng hàng với cột sống.\n" +
      "3. Thở ra, dùng cơ vai sau dang hai cánh tay sang ngang hai bên như cánh chim cho đến khi cùi chỏ ngang vai.\n" +
      "4. Hít vào, hạ tạ đơn xuống từ từ có kiểm soát về vị trí ban đầu.",
    cautions:
      "• Không nhổm thân người lên để lấy đà văng tạ.\n" +
      "• Không bẻ cong cổ tay khi nâng tạ.\n" +
      "• Chọn mức tạ nhẹ và tập trung tối đa vào cảm nhận cơ vai sau.",
  },
  28: {
    name: "Barbell Curl",
    instructions:
      "1. Đứng thẳng, hai chân rộng bằng vai, cầm thanh đòn với lòng bàn tay hướng về phía trước (underhand grip), tay rộng bằng vai.\n" +
      "2. Giữ hai cùi chỏ ép sát vào hai bên sườn, siết chặt cơ bụng và mở ngực.\n" +
      "3. Thở ra, co cơ bắp tay trước cuốn thanh đòn lên theo hình vòng cung về phía ngực trên, giữ cố định cùi chỏ.\n" +
      "4. Siết cơ bắp tay ở đỉnh trong 1 giây, sau đó hít vào và hạ đòn chậm rãi trong 2-3 giây cho đến khi tay duỗi thẳng hoàn toàn.",
    cautions:
      "• Không đung đưa thân người ra sau để văng tạ lên (cheat curl quá mức).\n" +
      "• Không đẩy cùi chỏ về phía trước khi cuốn đòn lên vì sẽ chuyển lực sang cơ vai trước.\n" +
      "• Luôn duỗi thẳng tay ở điểm đáy để đạt biên độ kéo giãn cơ bắp tay tối đa.",
  },
  29: {
    name: "Dumbbell Curl",
    instructions:
      "1. Đứng thẳng hoặc ngồi trên ghế phẳng, mỗi tay cầm một quả tạ đơn buông dọc theo thân người, lòng bàn tay hướng vào nhau.\n" +
      "2. Giữ cố định cùi chỏ sát sườn, thở ra và cuốn tạ lên đồng thời xoay cẳng tay ra ngoài (supination) sao cho lòng bàn tay ngửa lên trời khi tạ lên đỉnh.\n" +
      "3. Siết chặt bắp tay trước tại điểm cao nhất trong 1 giây.\n" +
      "4. Hít vào, hạ tạ chậm rãi đồng thời xoay cẳng tay trở lại vị trí ban đầu.",
    cautions:
      "• Tránh dùng đà lắc người hoặc nhún gối để nâng tạ.\n" +
      "• Không để cùi chỏ tách xa khỏi thân người hoặc dịch chuyển ra sau khi nâng.\n" +
      "• Thực hiện từng bên hoặc luân phiên có kiểm soát.",
  },
  30: {
    name: "Hammer Curl",
    instructions:
      "1. Đứng thẳng hoặc ngồi thẳng lưng, hai tay cầm tạ đơn buông dọc thân người với lòng bàn tay hướng vào nhau (neutral grip).\n" +
      "2. Cố định cùi chỏ sát sườn, thở ra và cuốn tạ đơn thẳng lên về phía vai như động tác đóng búa.\n" +
      "3. Giữ nguyên lòng bàn tay hướng vào nhau trong suốt chuyển động để tác động mạnh vào cơ brachialis và cơ cẳng tay.\n" +
      "4. Hít vào, hạ tạ từ từ có kiểm soát về vị trí ban đầu rồi thực hiện lại.",
    cautions:
      "• Không xoay cổ tay trong suốt bài tập; giữ nguyên thế nắm trung tính.\n" +
      "• Không văng tạ bằng đà thân người.\n" +
      "• Giữ cổ tay vững chắc, không để tạ kéo gập cổ tay sang hai bên.",
  },
  31: {
    name: "Incline Dumbbell Curl",
    instructions:
      "1. Chỉnh ghế nghiêng góc 45-60 độ. Ngồi tựa hoàn toàn lưng và đầu vào đệm ghế, hai tay cầm tạ đơn thả lỏng thẳng xuống sàn.\n" +
      "2. Cùi chỏ giữ hướng thẳng xuống sàn, thở ra và dùng cơ bắp tay trước cuốn tạ lên đồng thời xoay ngửa bàn tay ra ngoài.\n" +
      "3. Siết chặt đỉnh bắp tay trước trong 1 giây.\n" +
      "4. Hít vào, hạ tạ xuống từ từ có kiểm soát để cảm nhận cơ bắp tay được kéo căng sâu ở vị trí xuất phát.",
    cautions:
      "• Không nhấc bả vai hoặc nhổm người khỏi ghế khi nâng tạ.\n" +
      "• Không đưa cùi chỏ về phía trước để giảm tải.\n" +
      "• Cẩn thận với mức tạ quá nặng vì vị trí kéo giãn lớn tạo áp lực căng cao lên gân bắp tay trước.",
  },
  32: {
    name: "Preacher Curl",
    instructions:
      "1. Ngồi vào ghế Preacher, đặt nách ôm sát mép trên của đệm dốc, toàn bộ mặt sau cánh tay áp chặt vào mặt đệm.\n" +
      "2. Nắm thanh đòn EZ hoặc tạ đơn với lòng bàn tay ngửa, giữ cổ tay thẳng.\n" +
      "3. Thở ra, dùng cơ bắp tay trước cuốn tạ lên về phía cằm cho đến khi cẳng tay vuông góc với mặt sàn.\n" +
      "4. Hít vào, hạ tạ xuống chậm rãi có kiểm soát đến khi cánh tay duỗi gần thẳng (dừng trước khi khóa khớp khuỷu 5 độ).",
    cautions:
      "• Tuyệt đối không khóa thẳng đơ hoặc giật mạnh khớp khuỷu tay ở điểm thấp nhất vì nguy cơ rách gân bắp tay rất cao.\n" +
      "• Không nhổm mông rời ghế để dùng sức toàn thân kéo tạ lên.\n" +
      "• Luôn giữ cánh tay áp sát vào đệm, không nhấc nách ra khỏi đệm.",
  },
  33: {
    name: "Cable Curl",
    instructions:
      "1. Đứng trước máy kéo cáp thấp, gắn thanh đòn thẳng hoặc thanh EZ vào ròng rọc dưới. Nắm thanh đòn lòng bàn tay ngửa.\n" +
      "2. Bước lùi 1 bước nhỏ để giữ lực căng liên tục trên cáp, hai chân đứng vững, cùi chỏ ép sát sườn.\n" +
      "3. Thở ra, co bắp tay cuốn đòn lên về phía ngực trên, giữ cố định khuỷu tay.\n" +
      "4. Siết cơ tại đỉnh 1 giây, hít vào và nhả tạ xuống chậm rãi trong 2-3 giây.",
    cautions:
      "• Không đung đưa thân người ra sau để kéo cáp.\n" +
      "• Lực kéo của cáp là liên tục nên hãy kiểm soát tốt giai đoạn hạ tạ (eccentric).\n" +
      "• Giữ cổ tay thẳng, không gập cổ tay vào trong.",
  },
  34: {
    name: "Triceps Pushdown",
    instructions:
      "1. Đứng trước máy kéo cáp cao, gắn thanh đòn thẳng hoặc dây thừng. Đứng chân rộng bằng vai, hơi gập hông nhẹ về trước.\n" +
      "2. Cầm thanh đòn ngang ngực, ép chặt hai cùi chỏ vào hai bên mạn sườn và giữ cố định vị trí này.\n" +
      "3. Thở ra, dùng cơ tay sau đẩy thanh đòn thẳng xuống dưới cho đến khi cánh tay duỗi thẳng hoàn toàn.\n" +
      "4. Siết chặt cơ tay sau trong 1 giây, hít vào và từ từ đưa cẳng tay lên lại ngang ngực có kiểm soát.",
    cautions:
      "• Không để cùi chỏ dịch chuyển ra trước và sau; cùi chỏ phải đóng vai trò như một trục quay cố định.\n" +
      "• Không dồn toàn bộ trọng lượng thân người đè lên thanh đòn để đẩy tạ nặng.\n" +
      "• Tránh để vai bị rụt lên tai khi thả tạ lên.",
  },
  35: {
    name: "Overhead Triceps Extension",
    instructions:
      "1. Ngồi thẳng lưng trên ghế tựa thấp hoặc đứng vững. Dùng hai tay nâng một quả tạ đơn nặng qua đầu, hai bàn tay đỡ lấy mặt trong của bánh tạ.\n" +
      "2. Cánh tay giơ thẳng lên trời, khép hai cùi chỏ hướng về phía trước và áp sát hai bên tai.\n" +
      "3. Hít vào, giữ cố định bắp tay, chỉ gập cẳng tay hạ tạ đơn xuống ra sau đầu cho đến khi cơ tay sau căng hết cỡ.\n" +
      "4. Thở ra, dùng cơ tay sau duỗi cẳng tay đưa tạ trở lại vị trí thẳng đứng trên đầu.",
    cautions:
      "• Không để cùi chỏ bạnh rộng sang hai bên vì sẽ làm giảm tác động vào đầu dài cơ tay sau và hại khớp khuỷu.\n" +
      "• Không ưỡn cong thắt lưng ra trước khi nâng tạ; gồng chặt cơ bụng để giữ cột sống thẳng.\n" +
      "• Cẩn thận khi đưa tạ ra sau đầu, giữ tạ chắc chắn bằng cả hai tay.",
  },
  36: {
    name: "Skull Crusher",
    instructions:
      "1. Nằm ngửa trên ghế phẳng, hai tay cầm thanh đòn EZ với khoảng cách hẹp, giơ thẳng thanh đòn lên vuông góc với ngực.\n" +
      "2. Hơi nghiêng cánh tay về phía sau đầu khoảng 10-15 độ để duy trì lực căng liên tục lên cơ tay sau.\n" +
      "3. Hít vào, giữ cố định bắp tay, gập cùi chỏ hạ thanh đòn chậm rãi về phía trán hoặc đỉnh đầu.\n" +
      "4. Thở ra, dùng lực cơ tay sau đẩy thanh đòn trở lại vị trí xuất phát mà không dịch chuyển bắp tay.",
    cautions:
      "• Luôn tập trung cao độ và kiểm soát tốc độ tạ đi xuống để tránh tạ va đập vào vùng đầu/mặt.\n" +
      "• Không mở rộng cùi chỏ sang hai bên khi hạ tạ.\n" +
      "• Nên nhờ người hỗ trợ (spotter) đứng sau khi thực hiện mức tạ nặng.",
  },
  37: {
    name: "Close Grip Bench Press",
    instructions:
      "1. Nằm trên ghế phẳng, mắt dưới thanh đòn. Nắm thanh đòn với khoảng cách hai tay hẹp bằng vai (khoảng 30-40 cm).\n" +
      "2. Nhấc đòn khỏi giá và giữ thẳng trên ngực, chân bám chắc trên sàn, khép bả vai.\n" +
      "3. Hít vào, hạ đòn xuống có kiểm soát chạm vào ngực dưới, giữ cùi chỏ khép sát vào hai bên sườn (góc 30 độ).\n" +
      "4. Thở ra, dùng lực cơ tay sau và ngực đẩy thanh đòn thẳng lên vị trí ban đầu.",
    cautions:
      "• Không nắm hai tay quá sát nhau (dưới 20 cm) vì sẽ tạo áp lực bẻ xoắn rất có hại cho khớp cổ tay và khuỷu tay.\n" +
      "• Không bạnh cùi chỏ sang hai bên.\n" +
      "• Kiểm soát tạ khi chạm ngực, không để đòn nảy bật trên xương sườn.",
  },
  38: {
    name: "Bench Dips",
    instructions:
      "1. Đặt hai bàn tay lên mép ghế phẳng phía sau lưng, khoảng cách tay rộng bằng vai, các ngón tay hướng về phía trước.\n" +
      "2. Duỗi hai chân ra phía trước (gập gối 90 độ cho người mới bắt đầu hoặc duỗi thẳng chân để tăng độ khó).\n" +
      "3. Hít vào, gập cùi chỏ hạ thấp thân người xuống thẳng đứng sát mép ghế cho đến khi cánh tay tạo góc vuông 90 độ.\n" +
      "4. Thở ra, ấn mạnh lòng bàn tay xuống ghế duỗi thẳng cánh tay nâng cơ thể trở lại vị trí ban đầu.",
    cautions:
      "• Giữ lưng và mông di chuyển sát mép ghế, không đưa người quá xa về phía trước vì sẽ gây vặn và đau khớp vai.\n" +
      "• Không hạ người quá sâu vượt quá góc 90 độ của khuỷu tay.\n" +
      "• Giữ vai luôn ép hạ xuống, tránh rụt cổ khi đẩy người lên.",
  },
  39: {
    name: "Front Squat",
    instructions:
      "1. Đặt thanh đòn trên giá ngang tầm ngực. Đặt đòn lên phần trước cơ vai, dùng đầu ngón tay đỡ thanh đòn (Clean grip) hoặc bắt chéo hai cánh tay.\n" +
      "2. Nâng cùi chỏ lên cao song song với sàn, bước lùi ra khỏi giá, đứng chân rộng bằng vai, mũi chân hơi mở.\n" +
      "3. Hít sâu gồng cứng cơ bụng, giữ thân người gần như thẳng đứng, gập hông và gối hạ người xuống sâu tối đa trong tầm kiểm soát.\n" +
      "4. Giữ cùi chỏ luôn hướng lên cao, đạp mạnh chân xuống sàn đẩy người đứng thẳng dậy và thở ra.",
    cautions:
      "• Không để cùi chỏ bị tụt xuống thấp vì thanh đòn sẽ trượt khỏi vai và làm cong lưng trên.\n" +
      "• Luôn giữ thân người thẳng đứng hơn nhiều so với back squat; không đổ người quá nhiều về phía trước.\n" +
      "• Khởi động kỹ khớp cổ tay và vai trước khi thực hiện kiểu nắm Clean grip.",
  },
  40: {
    name: "Leg Press",
    instructions:
      "1. Ngồi vào máy đạp đùi, tựa sát lưng và mông vào đệm ngồi. Đặt hai bàn chân ở giữa bàn đạp, rộng bằng vai, mũi chân hơi chếch nhẹ.\n" +
      "2. Mở khóa an toàn, hít sâu và gồng cứng cơ bụng, hai tay nắm chặt tay cầm hai bên sườn ghế.\n" +
      "3. Hạ bàn đạp xuống có kiểm soát cho đến khi đùi tạo góc khoảng 90 độ với cẳng chân (đầu gối hướng về phía vai).\n" +
      "4. Thở ra, đạp mạnh gót và lòng bàn chân đẩy bàn đạp lên trở lại; dừng lại trước khi đầu gối bị khóa khớp hoàn toàn.",
    cautions:
      "• TUYỆT ĐỐI KHÔNG khóa thẳng đơ khớp gối (lockout) ở đỉnh vì có thể dẫn đến gãy gập khớp gối ngược ra sau cực kỳ nguy hiểm.\n" +
      "• Tuyệt đối không để mông hoặc lưng dưới bị cuộn nhấc khỏi mặt đệm tựa khi hạ tạ sâu.\n" +
      "• Không để đầu gối chụm vào trong khi đạp tạ nặng.",
  },
  41: {
    name: "Hack Squat",
    instructions:
      "1. Bước vào máy Hack Squat, tựa sát lưng và đầu vào đệm, đặt vai dưới hai đệm tỳ vai.\n" +
      "2. Đặt chân ở giữa hoặc hơi chếch về trước trên bàn đạp, chân rộng bằng vai, mũi chân mở nhẹ 15-30 độ.\n" +
      "3. Tháo chốt an toàn, hít sâu gồng cơ bụng, hạ thấp người xuống có kiểm soát cho đến khi đùi song song hoặc sâu hơn bàn đạp.\n" +
      "4. Thở ra, đạp mạnh chân đẩy xe trượt lên vị trí xuất phát, giữ đầu gối hơi chùng nhẹ ở đỉnh chuyển động.",
    cautions:
      "• Không khóa gắt khớp gối ở đỉnh chuyển động.\n" +
      "• Luôn giữ lưng dưới áp sát vào đệm tựa, không để khoảng hở giữa thắt lưng và đệm.\n" +
      "• Hướng đầu gối di chuyển theo đúng chiều của các ngón chân.",
  },
  42: {
    name: "Bulgarian Split Squat",
    instructions:
      "1. Đứng quay lưng lại với ghế phẳng, bước một chân về phía trước khoảng 80-100 cm, đặt mu bàn chân sau lên mặt ghế.\n" +
      "2. Giữ thân người thẳng hoặc hơi đổ nhẹ về trước 10-15 độ để tập trung vào cơ mông, hai tay cầm tạ đơn hoặc buông tự nhiên.\n" +
      "3. Hít vào, hạ thấp trọng tâm thẳng đứng xuống bằng cách gập đầu gối chân trước cho đến khi đùi trước song song với sàn.\n" +
      "4. Thở ra, dồn lực vào gót chân trước đạp mạnh đứng thẳng người dậy trở về vị trí ban đầu.",
    cautions:
      "• Không để đầu gối chân trước bị sụp đổ vào trong; luôn giữ đầu gối thẳng hàng với mũi chân.\n" +
      "• Không đặt chân trước quá gần ghế khiến gót chân bị nhấc bổng khi hạ thấp người.\n" +
      "• Duy trì thăng bằng tốt trước khi tăng thêm mức tạ.",
  },
  43: {
    name: "Walking Lunge",
    instructions:
      "1. Đứng thẳng, hai chân khép gần nhau, hai tay cầm tạ đơn hai bên hoặc chống hông, mắt nhìn thẳng phía trước.\n" +
      "2. Bước một bước dài về phía trước, tiếp đất bằng gót chân rồi hạ thấp hông xuống cho đến khi cả hai đầu gối đều tạo góc khoảng 90 độ.\n" +
      "3. Đầu gối chân sau hạ sát chạm nhẹ sàn (không đập mạnh), thân người giữ thẳng đứng và core gồng chắc.\n" +
      "4. Thở ra, dồn lực vào chân trước đạp đứng lên và bước chân sau thẳng về phía trước để tiếp tục lần lặp tiếp theo.",
    cautions:
      "• Không để đầu gối chân trước trượt quá xa vượt qua mũi chân khiến gót chân nhấc lên.\n" +
      "• Tránh đung đưa hoặc lắc lư thân trên sang hai bên khi di chuyển.\n" +
      "• Không để đầu gối sau đập mạnh xuống sàn cứng gây chấn thương xương bánh chè.",
  },
  44: {
    name: "Leg Extension",
    instructions:
      "1. Ngồi vào máy đá đùi, chỉnh lưng ghế tựa sát lưng, đặt cẳng chân phía sau đệm lăn (đệm nằm ngay trên cổ chân).\n" +
      "2. Hai tay nắm chặt tay cầm hai bên ghế để cố định cơ thể không bị nhấc mông lên.\n" +
      "3. Thở ra, dùng cơ đùi trước đá cẳng chân lên cao cho đến khi chân duỗi thẳng hoàn toàn.\n" +
      "4. Giữ siết chặt cơ đùi trước trong 1 giây ở đỉnh, sau đó hít vào và hạ tạ xuống chậm rãi trong 2-3 giây.",
    cautions:
      "• Không dùng đà giật mạnh tạ lên làm tăng đột ngột áp lực cắt (shear force) lên dây chằng chéo trước (ACL).\n" +
      "• Không để các tấm tạ va đập vào nhau ở đáy chuyển động.\n" +
      "• Nếu có tiền sử thoái hóa hoặc đau khớp bánh chè đùi, không nên tập bài này với mức tạ quá nặng.",
  },
  45: {
    name: "Romanian Deadlift",
    instructions:
      "1. Đứng thẳng cầm thanh đòn hoặc 2 tạ đơn trước đùi, hai chân rộng bằng hông, mũi chân hướng thẳng, đầu gối hơi chùng nhẹ cố định.\n" +
      "2. Mở ngực, siết cơ bả vai và gồng chặt cơ bụng. Bắt đầu đẩy hông tối đa ra phía sau (hip hinge).\n" +
      "3. Hạ thanh đòn trượt sát dọc theo đùi và cẳng chân cho đến khi tạ qua đầu gối và cảm nhận cơ đùi sau căng mạnh, giữ lưng dưới tuyệt đối thẳng.\n" +
      "4. Thở ra, siết chặt cơ mông và đẩy hông về phía trước để đứng thẳng người trở lại tư thế ban đầu.",
    cautions:
      "• Tuyệt đối không cong lưng dưới khi hạ tạ; chỉ hạ tạ sâu đến giới hạn mà lưng còn giữ được độ thẳng tự nhiên.\n" +
      "• Đây là chuyển động gập hông (hip hinge) chứ không phải squat; không gập gối xuống quá nhiều.\n" +
      "• Giữ thanh đòn luôn sát vào cơ thể, không để tạ trôi xa về phía trước.",
  },
  46: {
    name: "Lying Leg Curl",
    instructions:
      "1. Nằm sấp trên máy móc đùi, khớp gối đặt ngay thẳng hàng với trục quay của máy. Đặt đệm lăn tỳ phía sau cổ chân (dưới bắp chuối).\n" +
      "2. Hai tay nắm chặt tay cầm phía trước, ép xương chậu sát xuống mặt đệm.\n" +
      "3. Thở ra, dùng cơ đùi sau cuộn cẳng chân lên tối đa về phía mông.\n" +
      "4. Giữ siết cơ đùi sau 1 giây tại điểm co đỉnh, sau đó hít vào và từ từ duỗi chân ra có kiểm soát trong 2-3 giây.",
    cautions:
      "• Không nhấc mông hoặc ưỡn cong thắt lưng rời khỏi đệm để lấy đà cuốn tạ.\n" +
      "• Không thả rơi tạ đột ngột ở giai đoạn duỗi chân.\n" +
      "• Giữ mũi chân gập tự nhiên (dorsiflexion) để tăng kích hoạt cơ đùi sau.",
  },
  47: {
    name: "Seated Leg Curl",
    instructions:
      "1. Ngồi vào máy móc đùi, chỉnh lưng ghế áp sát, đặt đệm đùi ép chặt phía trên đầu gối để cố định chân.\n" +
      "2. Đặt gót chân/cổ chân sau lên trên đệm lăn, hai chân duỗi thẳng phía trước.\n" +
      "3. Thở ra, dùng cơ đùi sau gập cẳng chân xuống dưới và kéo sâu vào gầm ghế.\n" +
      "4. Giữ chặt cơ đùi sau ở điểm co cực đại 1 giây, hít vào và nhả chân từ từ trở lại vị trí xuất phát.",
    cautions:
      "• Khóa chặt đệm giữ đùi để tránh việc đùi bị nhấc bổng khi gập tạ.\n" +
      "• Không ngả người hoặc giật đà thân trên ra sau.\n" +
      "• Kiểm soát tốc độ khi chân duỗi lên, không để tạ chạm cọc va đập mạnh.",
  },
  48: {
    name: "Hip Thrust",
    instructions:
      "1. Ngồi tựa mép lưng trên (ngay dưới bả vai) vào cạnh ghế phẳng dài. Lăn thanh đòn có bọc đệm xốp vào khớp háng, co chân gối tạo góc 90 độ.\n" +
      "2. Bàn chân đặt rộng bằng vai, mũi chân hơi chếch nhẹ, hai tay giữ thanh đòn cố định.\n" +
      "3. Hít sâu gồng bụng, thở ra và đạp mạnh gót chân nâng hông lên cao cho đến khi đùi, hông và thân người tạo thành một đường thẳng song song với sàn.\n" +
      "4. Siết chặt cơ mông hết mức ở đỉnh trong 1-2 giây (cằm gập nhẹ nhìn về trước), sau đó hít vào hạ hông xuống có kiểm soát.",
    cautions:
      "• Không ưỡn ngực hoặc ưỡn quá đà thắt lưng (hyperextension) ở đỉnh chuyển động; dùng cơ mông để khóa hông, không dùng thắt lưng.\n" +
      "• Giữ mắt nhìn về phía trước hoặc hơi chếch xuống gối, không ngửa đầu ra sau.\n" +
      "• Luôn dùng đệm lót thanh đòn dày để tránh tổn thương xương chậu khi nâng tạ nặng.",
  },
  49: {
    name: "Glute Bridge",
    instructions:
      "1. Nằm ngửa trên thảm sàn, hai tay buông dọc thân người. Co hai đầu gối lại, đặt hai bàn chân phẳng trên sàn cách mông khoảng một gang tay.\n" +
      "2. Hít vào gồng cơ bụng, thở ra và ấn mạnh hai gót chân xuống sàn để đẩy hông lên cao.\n" +
      "3. Nâng hông lên đến khi đầu gối, hông và vai tạo thành một đường thẳng tắp, ép chặt hai cơ mông ở đỉnh trong 2 giây.\n" +
      "4. Hít vào, hạ hông xuống từ từ chạm nhẹ mặt sàn rồi tiếp tục lần lặp tiếp theo.",
    cautions:
      "• Không đẩy hông lên quá cao làm cong vênh thắt lưng dưới.\n" +
      "• Tập trung phát lực từ gót chân và cơ mông, không dùng sức cơ đùi trước hay cơ lưng dưới.\n" +
      "• Giữ đầu gối ổn định theo hướng ngón chân, không khép chụm đầu gối vào nhau.",
  },
  50: {
    name: "Good Morning",
    instructions:
      "1. Đặt thanh đòn trên phần cơ vai sau (Low bar) giống tư thế squat, hai tay nắm chắc thanh đòn.\n" +
      "2. Đứng thẳng, chân rộng bằng vai, đầu gối hơi chùng nhẹ (micro-bend) và cố định độ cong này.\n" +
      "3. Hít sâu gồng chặt cơ bụng, bắt đầu đẩy hông ra sau cúi gập thân trên về trước, giữ lưng dưới tuyệt đối thẳng.\n" +
      "4. Gập người cho đến khi thân trên gần song song với sàn và cơ đùi sau căng mạnh; thở ra siết mông đẩy hông đứng thẳng trở lại.",
    cautions:
      "• CỰC KỲ NGUY HIỂM nếu cong lưng; luôn khóa chặt cơ dựng sống và cơ core trong suốt bài tập.\n" +
      "• Bắt đầu tập với thanh đòn không tải hoặc mức tạ rất nhẹ để thành thục kỹ thuật trước khi tăng tải.\n" +
      "• Không gập đầu gối biến thành bài squat; động tác hoàn toàn là chuyển động bản lề hông (hip hinge).",
  },
  51: {
    name: "Standing Calf Raise",
    instructions:
      "1. Đứng nửa bàn chân trước trên bục nâng hoặc mép bàn đạp máy nhón bắp chân, gót chân thả lỏng ngoài bục.\n" +
      "2. Tựa đệm vai của máy lên vai hoặc cầm tạ đơn, giữ thân người và đầu gối thẳng (hơi chùng cực nhẹ để bảo vệ khớp).\n" +
      "3. Hạ gót chân xuống sâu dưới mép bục có kiểm soát để kéo giãn tối đa cơ bắp chuối trong 1 giây.\n" +
      "4. Thở ra, ấn mạnh phần đệm ngón chân nhón gót chân lên cao nhất có thể, siết chặt bắp chuối ở đỉnh trong 1-2 giây.",
    cautions:
      "• Không nhún nhảy hoặc giật nảy gót chân ở đáy để lấy đà gân Achilles.\n" +
      "• Luôn thực hiện đầy đủ biên độ: hạ sâu hết cỡ để kéo giãn và nhón cao hết cỡ để co cơ.\n" +
      "• Giữ thăng bằng vững chắc và thẳng lưng.",
  },
  52: {
    name: "Seated Calf Raise",
    instructions:
      "1. Ngồi vào máy nhón bắp chân, đặt nửa bàn chân trước lên bàn đạp, gót chân thả tự do ngoài mép.\n" +
      "2. Đặt đệm tỳ đùi ngay sát phía trên đầu gối, chỉnh đệm vừa vặn giữ chặt đùi, hai tay giữ cần nhả khóa an toàn.\n" +
      "3. Nhả chốt an toàn, hạ gót chân xuống sâu có kiểm soát để kéo giãn cơ bắp chân dạng dẹt (soleus).\n" +
      "4. Thở ra, nhón mũi chân đẩy đệm tỳ lên cao nhất có thể, dừng lại siết cơ 1-2 giây rồi lặp lại.",
    cautions:
      "• Không dùng tay giật đệm lên hỗ trợ chân.\n" +
      "• Không nảy tạ ở điểm dưới cùng.\n" +
      "• Bài tập ngồi tác động chuyên biệt vào cơ dép (soleus), cần kiểm soát nhịp độ chậm rãi.",
  },
  53: {
    name: "Plank",
    instructions:
      "1. Nằm sấp trên sàn thảm, chống hai cẳng tay xuống sàn sao cho khuỷu tay vuông góc ngay dưới khớp vai.\n" +
      "2. Chống hai mũi chân xuống sàn, nâng toàn bộ cơ thể lên sao cho từ gót chân, mông, lưng đến đầu tạo thành một đường thẳng tắp.\n" +
      "3. Siết chặt cơ bụng, cơ mông và cơ đùi trước, chủ động cuộn nhẹ xương chậu ra sau (posterior pelvic tilt).\n" +
      "4. Giữ nguyên tư thế tĩnh này, duy trì nhịp hít thở đều đặn bằng cơ hoành trong suốt thời gian mục tiêu.",
    cautions:
      "• Tuyệt đối không để võng lưng dưới xuống sàn vì sẽ dồn toàn bộ áp lực làm đau cột sống thắt lưng.\n" +
      "• Không nhô mông lên cao hình tam giác để giảm độ nặng.\n" +
      "• Không nín thở; hít thở chậm và đều đặn khi gồng core.",
  },
  54: {
    name: "Hanging Leg Raise",
    instructions:
      "1. Hai tay nắm chắc thanh xà đơn rộng hơn vai, treo người tự do, kéo nhẹ bả vai xuống để cố định khớp vai.\n" +
      "2. Hai chân khép sát duỗi thẳng (hoặc co nhẹ gối nếu mới tập), hít vào gồng cơ bụng.\n" +
      "3. Thở ra, dùng cơ bụng cuộn xương chậu và nâng hai chân lên cao về phía trước cho đến khi chân song song với sàn (hoặc chạm xà).\n" +
      "4. Giữ co bóp cơ bụng ở đỉnh 1 giây, sau đó hít vào hạ chân xuống chậm rãi có kiểm soát, triệt tiêu mọi quán tính đung đưa.",
    cautions:
      "• Không đung đưa người lấy đà (swinging) để văng chân lên.\n" +
      "• Phải chủ động cuộn xương chậu lên thay vì chỉ nâng đùi bằng cơ gập hông (hip flexors).\n" +
      "• Nếu thấy đung đưa, dừng lại ổn định thân người rồi mới thực hiện lần lặp tiếp theo.",
  },
  55: {
    name: "Cable Crunch",
    instructions:
      "1. Quỳ gối trước máy kéo cáp cao, gắn dây thừng (rope attachment). Kéo hai đầu dây thừng đặt hai bên tai hoặc hai bên thái dương.\n" +
      "2. Hông giữ cố định hơi lùi nhẹ ra sau, giữ khoảng cách cố định giữa tay và đầu trong suốt bài tập.\n" +
      "3. Thở ra, cuộn cơ bụng gập thân người xuống sao cho cùi chỏ di chuyển hướng về phía giữa hai đầu gối.\n" +
      "4. Siết cứng cơ bụng tại điểm gập tối đa 1 giây, hít vào rồi từ từ trả thân người về vị trí ban đầu có kiểm soát.",
    cautions:
      "• Không gập hông ngồi bệt mông xuống gót chân để kéo tạ; hông phải giữ cố định, chuyển động hoàn toàn là sự uốn cong cột sống của cơ bụng.\n" +
      "• Không dùng lực tay kéo giật dây thừng.\n" +
      "• Không thả tạ rơi tự do kéo bật người lên.",
  },
  56: {
    name: "Ab Wheel Rollout",
    instructions:
      "1. Quỳ hai đầu gối trên thảm mềm, hai tay nắm chắc hai bên tay cầm của con lăn bụng, đặt con lăn ngay dưới ngực.\n" +
      "2. Siết chặt cơ mông, cuộn nhẹ xương chậu và gồng cứng cơ bụng, giữ lưng hơi cong nhẹ tự nhiên (hollow body).\n" +
      "3. Hít vào, từ từ lăn con lăn về phía trước, duỗi dài cơ thể ra xa nhất có thể trong khi vẫn duy trì khả năng kiểm soát thắt lưng.\n" +
      "4. Thở ra, dùng cơ bụng và cơ xô kéo con lăn trở lại vị trí ban đầu bên dưới ngực.",
    cautions:
      "• CỰC KỲ NGUY HIỂM nếu để võng thắt lưng khi lăn ra xa; nếu cơ bụng không đủ khỏe giữ lưng thẳng, hãy rút ngắn khoảng cách lăn.\n" +
      "• Không dùng lực kéo bằng hông đẩy lùi mông về trước; phải dùng cơ bụng cuộn người lại.\n" +
      "• Người mới tập nên lăn hướng vào tường để chặn cự ly an toàn.",
  },
  57: {
    name: "Russian Twist",
    instructions:
      "1. Ngồi trên thảm sàn, co nhẹ hai đầu gối, gót chân chạm sàn (hoặc nhấc bổng chân khỏi sàn khoảng 10 cm để tăng độ khó).\n" +
      "2. Ngả thân trên về sau tạo góc khoảng 45 độ so với mặt sàn, giữ lưng thẳng, hai tay chắp trước ngực hoặc cầm tạ nhẹ.\n" +
      "3. Thở ra, xoay toàn bộ thân trên từ phần eo sang bên phải, đưa hai tay sang sát sàn bên hông phải.\n" +
      "4. Hít vào xoay về giữa, sau đó thở ra xoay sang bên trái một cách nhịp nhàng và có kiểm soát.",
    cautions:
      "• Không gù cong lưng khi xoay người để tránh áp lực xoắn nguy hiểm lên đĩa đệm cột sống.\n" +
      "• Xoay toàn bộ thân trên lồng ngực chứ không chỉ quơ tay qua lại hai bên.\n" +
      "• Giữ đầu gối và xương chậu tương đối ổn định, tránh vặn vẹo toàn bộ thân dưới.",
  },
};

async function main() {
  console.log("Connecting to MySQL...");
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  console.log("Connected successfully to " + process.env.DB_DATABASE);

  // 1. Check & Alter table Exercises
  const [cols] = await conn.query("DESCRIBE exercises");
  const colNames = cols.map((c) => c.Field);

  if (!colNames.includes("instructions")) {
    console.log("Adding column instructions...");
    await conn.query("ALTER TABLE Exercises ADD COLUMN instructions TEXT NULL AFTER description");
  } else {
    console.log("Column instructions already exists.");
  }

  if (!colNames.includes("cautions")) {
    console.log("Adding column cautions...");
    await conn.query("ALTER TABLE Exercises ADD COLUMN cautions TEXT NULL AFTER instructions");
  } else {
    console.log("Column cautions already exists.");
  }

  // 2. Update data for all 57 exercises
  console.log("Updating data for all 57 exercises...");
  let updatedCount = 0;
  for (const [id, data] of Object.entries(exercisesData)) {
    const [result] = await conn.query(
      "UPDATE Exercises SET instructions = ?, cautions = ? WHERE exerciseId = ?",
      [data.instructions, data.cautions, Number(id)]
    );
    if (result.affectedRows > 0) {
      updatedCount++;
    } else {
      console.warn(`Warning: Exercise ID ${id} (${data.name}) not found or not updated.`);
    }
  }
  console.log(`Successfully updated instructions & cautions for ${updatedCount}/57 exercises.`);

  // 3. Update Stored Procedures
  console.log("Updating sp_GetAllExercises...");
  await conn.query("DROP PROCEDURE IF EXISTS sp_GetAllExercises");
  await conn.query(`
    CREATE PROCEDURE sp_GetAllExercises()
    BEGIN
        SELECT
            e.exerciseId,
            e.name,
            e.description,
            e.instructions,
            e.cautions,
            e.difficulty,
            (
                SELECT em.mediaUrl
                FROM ExerciseMedia em
                WHERE em.exerciseId = e.exerciseId
                  AND em.mediaType IN ('IMAGE', 'VIDEO')
                ORDER BY em.sortOrder ASC, em.mediaId ASC
                LIMIT 1
            ) AS preview,
            GROUP_CONCAT(
                DISTINCT CASE
                    WHEN emg.role = 'PRIMARY'
                    THEN mg.groupName
                END
                SEPARATOR ', '
            ) AS primaryMuscles,
            GROUP_CONCAT(
                DISTINCT CASE
                    WHEN emg.role = 'SECONDARY'
                    THEN mg.groupName
                END
                SEPARATOR ', '
            ) AS secondaryMuscles,
            GROUP_CONCAT(
                DISTINCT eq.equipmentName
                SEPARATOR ', '
            ) AS equipment
        FROM Exercises e
        LEFT JOIN ExerciseMuscleGroups emg
            ON e.exerciseId = emg.exerciseId
        LEFT JOIN MuscleGroups mg
            ON emg.groupId = mg.groupId
        LEFT JOIN ExerciseEquipment ee
            ON e.exerciseId = ee.exerciseId
        LEFT JOIN Equipment eq
            ON ee.equipmentId = eq.equipmentId
        GROUP BY
            e.exerciseId,
            e.name,
            e.description,
            e.instructions,
            e.cautions,
            e.difficulty
        ORDER BY e.exerciseId ASC;
    END
  `);

  console.log("Updating sp_GetTodayWorkout...");
  await conn.query("DROP PROCEDURE IF EXISTS sp_GetTodayWorkout");
  await conn.query(`
    CREATE PROCEDURE sp_GetTodayWorkout(
        IN p_profileId INT
    )
    BEGIN
        DECLARE v_planId INT;
        DECLARE v_dayId INT;

        SELECT guwp.planId
        INTO v_planId
        FROM GymUserWorkoutPlans guwp
        WHERE guwp.profileId = p_profileId
          AND guwp.status = 'ACTIVE'
        ORDER BY guwp.joinedAt DESC
        LIMIT 1;

        IF v_planId IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Người dùng chưa có lịch tập đang hoạt động';
        END IF;

        SELECT dayId
        INTO v_dayId
        FROM WorkoutDays
        WHERE planId = v_planId
          AND weekDay = WEEKDAY(CURDATE()) + 1
        LIMIT 1;

        SELECT
            wp.planId,
            wp.title AS planTitle,
            wd.dayId,
            wd.dayName,
            COUNT(ec.configId) AS totalExercises,
            COALESCE(SUM(ec.sets), 0) AS totalSets
        FROM WorkoutPlans wp
        LEFT JOIN WorkoutDays wd
            ON wd.dayId = v_dayId
        LEFT JOIN ExerciseConfigs ec
            ON ec.dayId = wd.dayId
        WHERE wp.planId = v_planId
        GROUP BY
            wp.planId,
            wp.title,
            wd.dayId,
            wd.dayName;

        SELECT
            ec.configId,
            ec.exerciseId,
            e.name AS exerciseName,
            e.description,
            e.instructions,
            e.cautions,
            e.difficulty,
            ec.sets,
            ec.reps,
            ec.restTime,
            ec.\`order\` AS exerciseOrder,
            (
                SELECT em.mediaUrl
                FROM ExerciseMedia em
                WHERE em.exerciseId = e.exerciseId
                ORDER BY
                    CASE
                        WHEN em.mediaType = 'IMAGE' THEN 0
                        ELSE 1
                    END,
                    em.sortOrder,
                    em.mediaId
                LIMIT 1
            ) AS preview
        FROM ExerciseConfigs ec
        INNER JOIN Exercises e
            ON e.exerciseId = ec.exerciseId
        WHERE ec.dayId = v_dayId
        ORDER BY ec.\`order\`;
    END
  `);

  console.log("Updating sp_GetWorkoutPlanDetail...");
  await conn.query("DROP PROCEDURE IF EXISTS sp_GetWorkoutPlanDetail");
  await conn.query(`
    CREATE PROCEDURE sp_GetWorkoutPlanDetail(
        IN p_planId INT
    )
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM WorkoutPlans
            WHERE planId = p_planId
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Chương trình không tồn tại';
        END IF;

        SELECT
            wp.planId,
            wp.title,
            wp.description,
            wp.creatorId,
            wp.isTemplate,
            wp.level,
            wp.goal,
            wp.durationWeeks,
            wp.createdAt,
            COUNT(DISTINCT wd.dayId) AS totalDays
        FROM WorkoutPlans wp
        LEFT JOIN WorkoutDays wd
            ON wd.planId = wp.planId
        WHERE wp.planId = p_planId
        GROUP BY
            wp.planId,
            wp.title,
            wp.description,
            wp.creatorId,
            wp.isTemplate,
            wp.level,
            wp.goal,
            wp.durationWeeks,
            wp.createdAt;

        SELECT
            wd.dayId,
            wd.dayName,
            wd.\`order\` AS dayOrder,
            wd.weekDay,
            ec.configId,
            ec.exerciseId,
            ec.sets,
            ec.reps,
            ec.restTime,
            ec.\`order\` AS exerciseOrder,
            e.name AS exerciseName,
            e.description AS exerciseDescription,
            e.instructions AS exerciseInstructions,
            e.cautions AS exerciseCautions,
            e.difficulty
        FROM WorkoutDays wd
        LEFT JOIN ExerciseConfigs ec
            ON ec.dayId = wd.dayId
        LEFT JOIN Exercises e
            ON e.exerciseId = ec.exerciseId
        WHERE wd.planId = p_planId
        ORDER BY
            wd.\`order\`,
            ec.\`order\`;

        SELECT DISTINCT
            em.mediaId,
            em.exerciseId,
            em.mediaUrl,
            em.publicId,
            em.mediaType,
            em.sortOrder,
            em.createdAt
        FROM WorkoutDays wd
        INNER JOIN ExerciseConfigs ec
            ON ec.dayId = wd.dayId
        INNER JOIN ExerciseMedia em
            ON em.exerciseId = ec.exerciseId
        WHERE wd.planId = p_planId
        ORDER BY
            em.exerciseId,
            em.sortOrder,
            em.mediaId;
    END
  `);

  console.log("All procedures updated successfully.");
  await conn.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
