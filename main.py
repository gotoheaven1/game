import time
import random

class Sim:
    def __init__(self, name):
        self.name = name
        # 기본 욕구 (0~100)
        self.hunger = 50   # 배고픔 (높을수록 배고픔)
        self.energy = 80   # 에너지 (낮을수록 피곤함)
        self.fun = 50      # 재미 (낮을수록 지루함)
        self.social = 50   # 사교 (낮을수록 외로움)
        
        # 자산 및 직업
        self.money = 500
        self.is_alive = True
        self.day = 1

    def show_status(self):
        print(f"\n{"="*30}")
        print(f" Day {self.day} | 이름: {self.name}")
        print(f"{"-"*30}")
        print(f" 🍎 배고픔: {self.hunger}/100")
        print(f" ⚡ 에너지: {self.energy}/100")
        print(f" 🎮 재미:   {self.fun}/100")
        print(f" 💰 자산:   {self.money}원")
        print(f"{"="*30}")

    def pass_time(self):
        """행동을 할 때마다 기본적으로 소모되는 수치"""
        self.hunger += 10
        self.energy -= 5
        
        # 사망 조건 체크
        if self.hunger >= 100:
            print(f"\n💀 {self.name}이(가) 굶어 죽었습니다...")
            self.is_alive = False
        if self.energy <= 0:
            print(f"\n😴 {self.name}이(가) 과로로 쓰러져 병원에 실려갔습니다. (치료비 발생)")
            self.money -= 200
            self.energy = 30

    def eat(self):
        if self.money >= 50:
            print(f"🍱 맛있는 도시락을 먹었습니다! (-50원)")
            self.money -= 50
            self.hunger = max(0, self.hunger - 40)
        else:
            print("❌ 돈이 부족해서 음식을 살 수 없습니다!")

    def sleep(self):
        print("💤 잠을 잡니다... 에너지가 회복됩니다.")
        time.sleep(1) # 실제 대기 시간 (몰입감용)
        self.energy = min(100, self.energy + 50)
        self.day += 1  # 잠을 자면 다음 날로 넘어감
        print(f"☀️ 다음 날 아침이 밝았습니다. (Day {self.day})")

    def work(self):
        print("💼 아르바이트를 하러 갑니다. (에너지 소모)")
        pay = random.randint(100, 200)
        self.money += pay
        self.energy -= 20
        self.fun -= 10
        print(f"💰 일당 {pay}원을 벌었습니다!")

    def play_game(self):
        print("🎮 게임을 하며 스트레스를 풉니다!")
        self.fun = min(100, self.fun + 40)
        self.energy -= 10

def main():
    print("✨ 텍스트 심즈(TextSims) 프로젝트에 오신 것을 환영합니다! ✨")
    name = input("심의 이름을 입력하세요: ")
    my_sim = Sim(name)

    while my_sim.is_alive:
        my_sim.show_status()
        print("1. 식사하기  2. 잠자기(다음 날)  3. 일하기  4. 게임하기  5. 종료")
        
        choice = input("행동을 선택하세요: ")

        if choice == '1':
            my_sim.eat()
        elif choice == '2':
            my_sim.sleep()
        elif choice == '3':
            my_sim.work()
        elif choice == '4':
            my_sim.play_game()
        elif choice == '5':
            print("게임을 종료합니다. 깃허브에 커밋하는 걸 잊지 마세요!")
            break
        else:
            print("⚠️ 잘못된 입력입니다.")
            continue

        my_sim.pass_time()

if __name__ == "__main__":
    main()
import time
import random

class Item:
    def __init__(self, name, price, energy_bonus=0, hunger_bonus=0, fun_bonus=0):
        self.name = name
        self.price = price
        self.energy_bonus = energy_bonus
        self.hunger_bonus = hunger_bonus
        self.fun_bonus = fun_bonus

class Sim:
    def __init__(self, name):
        self.name = name
        self.hunger = 50
        self.energy = 80
        self.fun = 50
        self.money = 1000
        self.inventory = []  # 소지 중인 아이템
        self.is_alive = True
        self.day = 1

    def show_status(self):
        print(f"\n{'='*40}")
        print(f" [Day {self.day}] {self.name}의 상태")
        print(f"{'-'*40}")
        print(f" 🍎 배고픔: {self.hunger}/100 | ⚡ 에너지: {self.energy}/100")
        print(f" 🎮 재미:   {self.fun}/100 | 💰 자산:   {self.money}원")
        print(f" 🎒 인벤토리: {[item.name for item in self.inventory] if self.inventory else '비어 있음'}")
        print(f"{'='*40}")

    def pass_time(self):
        self.hunger += 10
        self.energy -= 5
        if self.hunger >= 100:
            print(f"\n💀 {self.name}이(가) 배고픔을 견디지 못하고 세상을 떠났습니다...")
            self.is_alive = False

    def eat(self):
        # 인벤토리에 음식이 있는지 확인
        food_items = [i for i in self.inventory if i.hunger_bonus > 0]
        if food_items:
            food = food_items[0]
            print(f"🍴 인벤토리의 {food.name}을(를) 먹었습니다!")
            self.hunger = max(0, self.hunger - food.hunger_bonus)
            self.inventory.remove(food)
        else:
            print("🛒 인벤토리에 음식이 없습니다. 상점에서 사오세요!")

    def sleep(self):
        # 가구(침대) 보너스 확인
        bonus = 0
        if any(i.name == "고급 침대" for i in self.inventory):
            bonus = 30
            print("🛏️ 고급 침대에서 편안하게 잠을 잡니다.")
        
        print("💤 잠을 잡니다... (에너지 회복 중)")
        time.sleep(1)
        self.energy = min(100, self.energy + 50 + bonus)
        self.day += 1
        print(f"☀️ 다음 날 아침! (에너지 +{50 + bonus})")

    def work(self):
        pay = random.randint(150, 300)
        self.money += pay
        self.energy -= 20
        self.hunger += 15
        print(f"💼 업무 완료! {pay}원을 벌었지만 조금 지쳤습니다.")

def visit_store(player):
    items_for_sale = [
        Item("컵라면", 100, hunger_bonus=30),
        Item("피자", 500, hunger_bonus=80),
        Item("고급 침대", 2000, energy_bonus=30),
        Item("최신 게임기", 1500, fun_bonus=50)
    ]
    
    while True:
        print(f"\n🏪 [상점] 현재 잔액: {player.money}원")
        for i, item in enumerate(items_for_sale):
            print(f"{i+1}. {item.name} ({item.price}원) - 효과: 배고픔-{item.hunger_bonus}, 에너지보너스+{item.energy_bonus}")
        print("0. 나가기")
        
        choice = input("구매할 아이템 번호를 선택하세요: ")
        if choice == '0': break
        
        try:
            selected = items_for_sale[int(choice)-1]
            if player.money >= selected.price:
                player.money -= selected.price
                player.inventory.append(selected)
                print(f"✅ {selected.name}을(를) 구매했습니다!")
            else:
                print("❌ 돈이 부족합니다.")
        except:
            print("⚠️ 잘못된 입력입니다.")

def main():
    name = input("심의 이름을 입력하세요: ")
    player = Sim(name)

    while player.is_alive:
        player.show_status()
        print("1. 식사하기  2. 잠자기  3. 일하기  4. 상점방문  5. 종료")
        
        cmd = input("행동 선택: ")
        if cmd == '1': player.eat()
        elif cmd == '2': player.sleep()
        elif cmd == '3': player.work()
        elif cmd == '4': visit_store(player)
        elif cmd == '5': break
        
        player.pass_time()

if __name__ == "__main__":
    main()
import time
import random

# 직업 데이터 설정 (이름, 단계별 급여, 필요 능력치, 에너지 소모)
CAREER_DATA = {
    "개발자": [
        {"rank": "인턴", "salary": 200, "req_int": 0, "energy_loss": 15},
        {"rank": "주니어", "salary": 500, "req_int": 20, "energy_loss": 20},
        {"rank": "시니어", "salary": 1200, "req_int": 50, "energy_loss": 30}
    ],
    "아티스트": [
        {"rank": "거리의악사", "salary": 150, "req_cre": 0, "energy_loss": 10},
        {"rank": "일러스트레이터", "salary": 450, "req_cre": 20, "energy_loss": 20},
        {"rank": "마스터피스", "salary": 1100, "req_cre": 50, "energy_loss": 25}
    ]
}

class Sim:
    def __init__(self, name):
        self.name = name
        self.hunger = 50
        self.energy = 80
        self.money = 1000
        
        # 신규 능력치 및 직업 관련
        self.intelligence = 0  # 지성
        self.creativity = 0    # 예술성
        self.job_path = None   # 현재 직업군
        self.job_level = 0     # 현재 직급 (0, 1, 2)
        self.exp = 0           # 업무 경험치
        
        self.is_alive = True
        self.day = 1

    def show_status(self):
        job_info = f"{self.job_path} ({CAREER_DATA[self.job_path][self.job_level]['rank']})" if self.job_path else "무직"
        print(f"\n{'='*45}")
        print(f" [Day {self.day}] {self.name} | 직업: {job_info}")
        print(f"{'-'*45}")
        print(f" 🍎 배고픔: {self.hunger:>3}/100 | ⚡ 에너지: {self.energy:>3}/100 | 💰 자산: {self.money}원")
        print(f" 🧠 지성: {self.intelligence:>3} | 🎨 예술성: {self.creativity:>3} | 📈 경험: {self.exp}")
        print(f"{'='*45}")

    def study(self):
        print("📚 책을 읽으며 지성을 쌓습니다. (에너지 -15)")
        self.intelligence += 10
        self.energy -= 15

    def practice(self):
        print("🎨 그림을 그리며 예술성을 쌓습니다. (에너지 -15)")
        self.creativity += 10
        self.energy -= 15

    def apply_for_job(self):
        if self.job_path:
            print(f"이미 {self.job_path}로 일하고 있습니다!")
            return

        print("\n--- 구인 구직 게시판 ---")
        print("1. 개발자 (지성 중심)  2. 아티스트 (예술성 중심)")
        choice = input("원하는 직군을 선택하세요: ")
        if choice == '1':
            self.job_path = "개발자"
            print("🎉 축하합니다! 개발자 인턴으로 채용되었습니다.")
        elif choice == '2':
            self.job_path = "아티스트"
            print("🎉 축하합니다! 거리의 악사로 활동을 시작합니다.")

    def work(self):
        if not self.job_path:
            print("❌ 직업이 없습니다. 먼저 취직하세요!")
            return

        current_job_info = CAREER_DATA[self.job_path][self.job_level]
        
        print(f"💼 {self.job_path} 업무 중... (-{current_job_info['energy_loss']} 에너지)")
        self.money += current_job_info['salary']
        self.energy -= current_job_info['energy_loss']
        self.hunger += 10
        self.exp += 10
        print(f"💰 급여 {current_job_info['salary']}원이 입금되었습니다.")

        # 승진 체크
        self.check_promotion()

    def check_promotion(self):
        if self.job_level < 2:  # 최고 등급이 아닐 때
            next_level = self.job_level + 1
            next_job_info = CAREER_DATA[self.job_path][next_level]
            
            # 조건 체크: 경험치 30 이상 AND 필요 능력치 충족
            req_stat = next_job_info['req_int'] if self.job_path == "개발자" else next_job_info['req_cre']
            current_stat = self.intelligence if self.job_path == "개발자" else self.creativity
            
            if self.exp >= 30 and current_stat >= req_stat:
                self.job_level += 1
                self.exp = 0 # 경험치 초기화
                print(f"\n🎊 승진! 이제부터 '{next_job_info['rank']}'입니다! 월급이 인상되었습니다.")

    def pass_time(self):
        self.hunger += 5
        if self.hunger >= 100: self.is_alive = False

def main():
    player = Sim(input("심의 이름: "))

    while player.is_alive:
        player.show_status()
        print("1.취직하기  2.일하기  3.공부(지성↑)  4.연습(예술↑)  5.휴식  6.종료")
        
        cmd = input("행동: ")
        if cmd == '1': player.apply_for_job()
        elif cmd == '2': player.work()
        elif cmd == '3': player.study()
        elif cmd == '4': player.practice()
        elif cmd == '5': 
            player.energy = min(100, player.energy + 30)
            player.day += 1
            print("🛌 푹 쉬었습니다.")
        elif cmd == '6': break
        
        player.pass_time()

if __name__ == "__main__":
    main()
import time
import random

class Sim:
    def __init__(self, name, parents=None, money=1000, generation=1):
        self.name = name
        self.parents = parents # 부모님 이름 리스트
        self.generation = generation
        
        # 상태 수치
        self.hunger = 50
        self.energy = 80
        self.money = money
        self.age = 20  # 20세 시작
        
        # 가족 관계
        self.spouse = None
        self.children = []
        
        self.is_alive = True
        self.day = 1

    def show_status(self):
        print(f"\n{'='*50}")
        print(f" [{self.generation}세대] {self.name} ({self.age}세) | Day {self.day}")
        print(f" 👨‍👩‍👧 가족: 배우자({self.spouse if self.spouse else '없음'}), 자녀({len(self.children)}명)")
        print(f"{'-'*50}")
        print(f" 🍎 배고픔: {self.hunger}/100 | ⚡ 에너지: {self.energy}/100 | 💰 자산: {self.money}원")
        print(f"{'='*50}")

    def aging(self):
        """시간이 흐름에 따른 노화 로직"""
        self.day += 1
        if self.day % 5 == 0: # 5일마다 1살씩 먹음
            self.age += 1
            print(f"\n🎂 축하합니다! {self.name}이(가) {self.age}살이 되었습니다.")
        
        # 사망 확률 (80세부터 급증)
        death_chance = 0
        if self.age >= 80:
            death_chance = (self.age - 79) * 5
            if random.randint(1, 100) <= death_chance:
                print(f"\n👻 {self.name}이(가) 노환으로 평화롭게 눈을 감았습니다...")
                self.is_alive = False

    def find_spouse(self):
        if self.spouse:
            print("이미 배우자가 있습니다!")
            return
        if self.money < 500:
            print("데이트 비용이 부족합니다! (최소 500원 필요)")
            return
        
        print("💞 사랑을 찾아 떠납니다...")
        time.sleep(1)
        if random.random() > 0.5:
            self.spouse = "NPC_" + str(random.randint(100, 999))
            self.money -= 500
            print(f"💍 {self.spouse}와(과) 결혼에 성공했습니다!")
        else:
            print("💔 인연을 만나지 못했습니다.")

    def have_child(self):
        if not self.spouse:
            print("먼저 배우자를 찾아야 합니다!")
            return
        if self.money < 1000:
            print("육아 비용이 부족합니다! (최소 1000원 필요)")
            return

        child_name = input("아이의 이름을 지어주세요: ")
        new_child = Sim(child_name, parents=[self.name, self.spouse], 
                        money=0, generation=self.generation + 1)
        self.children.append(new_child)
        self.money -= 1000
        print(f"👶 {child_name}이(가) 태어났습니다! 가계도에 등록됩니다.")

def show_family_tree(history):
    print("\n📜 --- 가문 기록부 (Family Tree) ---")
    for record in history:
        print(f"[{record['gen']}세대] {record['name']} | 수명: {record['age']}세 | 자녀: {record['child_count']}명")
    print("----------------------------------")

def main():
    family_history = []
    current_sim = Sim(input("초대 심의 이름: "))

    while True:
        while current_sim.is_alive:
            current_sim.show_status()
            print("1.일하기  2.휴식  3.배우자찾기  4.자녀낳기  5.가계도보기  6.종료")
            
            cmd = input("행동: ")
            if cmd == '1':
                current_sim.money += 300
                current_sim.energy -= 20
                print("💼 열심히 일해서 300원을 벌었습니다.")
            elif cmd == '2':
                current_sim.energy = min(100, current_sim.energy + 40)
                current_sim.aging() # 휴식할 때 시간이 흐름
                print("🛌 잠을 자며 기력을 회복합니다.")
            elif cmd == '3':
                current_sim.find_spouse()
            elif cmd == '4':
                current_sim.have_child()
            elif cmd == '5':
                show_family_tree(family_history)
            elif cmd == '6':
                return

            # 기본 욕구 소모
            current_sim.hunger += 10
            if current_sim.hunger >= 100:
                print(f"💀 {current_sim.name}이(가) 굶어 죽었습니다.")
                current_sim.is_alive = False

        # 현재 심 사망 시 처리
        family_history.append({
            "gen": current_sim.generation,
            "name": current_sim.name,
            "age": current_sim.age,
            "child_count": len(current_sim.children)
        })

        if current_sim.children:
            print(f"\n🧬 {current_sim.name}의 유지를 이을 자녀를 선택하세요.")
            for i, child in enumerate(current_sim.children):
                print(f"{i+1}. {child.name}")
            
            choice = int(input("번호 선택: ")) - 1
            inheritance = current_sim.money // 2 # 유산 50% 물려받음
            
            # 다음 세대로 전환
            next_sim = current_sim.children[choice]
            next_sim.money = inheritance
            current_sim = next_sim
            print(f"\n🌟 새로운 세대 시작! {current_sim.name}의 이야기로 이어갑니다.")
        else:
            print("\n🚨 대를 이을 자녀가 없습니다. 가문이 멸문되었습니다.")
            show_family_tree(family_history)
            break

if __name__ == "__main__":
    main()
import time
import random

class Disease:
    def __init__(self, name, severity, cure_cost):
        self.name = name
        self.severity = severity # 매 턴 깎이는 건강 수치
        self.cure_cost = cure_cost

class Sim:
    def __init__(self, name, parents=None, money=1000, generation=1, inherited_stats=None):
        self.name = name
        self.generation = generation
        self.money = money
        self.age = 20
        self.is_alive = True
        self.day = 1
        
        # 상태 수치
        self.hunger = 50
        self.energy = 80
        self.health = 100 # 신규: 건강 수치
        
        # 능력치 (유전 반영)
        if inherited_stats:
            self.intelligence = inherited_stats['int'] + random.randint(-5, 10)
            self.creativity = inherited_stats['cre'] + random.randint(-5, 10)
        else:
            self.intelligence = 10
            self.creativity = 10
            
        self.diseases = [] # 현재 걸린 질병들
        self.spouse = None
        self.children = []

    def show_status(self):
        disease_str = f" [질환: {', '.join([d.name for d in self.diseases])}]" if self.diseases else " [건강함]"
        print(f"\n{'='*55}")
        print(f" [{self.generation}세대] {self.name} ({self.age}세) | {disease_str}")
        print(f"{'-'*55}")
        print(f" 🍎배고픔: {self.hunger:>3} | ⚡에너지: {self.energy:>3} | ❤️건강: {self.health:>3}")
        print(f" 🧠지성: {self.intelligence:>3} | 🎨예술성: {self.creativity:>3} | 💰자산: {self.money}원")
        print(f"{'='*55}")

    def pass_time(self):
        self.day += 1
        self.hunger += 5
        self.energy -= 2
        
        # 1. 질병 진행 및 건강 악화
        for d in self.diseases:
            self.health -= d.severity
            print(f"⚠️ {d.name} 증상으로 건강이 악화됩니다. (건강 -{d.severity})")

        # 2. 질병 발생 확률 (건강/에너지가 낮을수록 상승)
        if self.health < 50 or self.energy < 30:
            if random.random() < 0.2 and not self.diseases:
                new_disease = random.choice([
                    Disease("독감", 5, 300),
                    Disease("식중독", 8, 500),
                    Disease("우울증", 3, 800)
                ])
                self.diseases.append(new_disease)
                print(f"🤒 질병에 걸렸습니다: {new_disease.name}!")

        # 3. 돌발 사고 (0.5% 확률)
        if random.random() < 0.005:
            print("\n🚨 [돌발 사고] 길을 가다 무거운 화분에 맞았습니다!")
            self.health -= 50

        # 4. 사망 조건 체크
        if self.health <= 0:
            print(f"💀 {self.name}이(가) 질병을 이기지 못하고 사망했습니다.")
            self.is_alive = False
        elif self.hunger >= 100:
            print(f"💀 {self.name}이(가) 아사했습니다.")
            self.is_alive = False
        
        if self.day % 10 == 0: self.age += 1

    def go_to_hospital(self):
        print("\n🏥 병원에 방문했습니다.")
        if not self.diseases and self.health >= 100:
            print("의사: 아주 건강하시네요! 볼일 없습니다.")
            return

        total_cost = sum([d.cure_cost for d in self.diseases]) + 200 # 기본 진료비 200원
        print(f"총 치료비 예상: {total_cost}원 (건강 100까지 회복 포함)")
        
        choice = input("치료받으시겠습니까? (y/n): ")
        if choice.lower() == 'y' and self.money >= total_cost:
            self.money -= total_cost
            self.diseases = []
            self.health = 100
            print("💉 치료 완료! 다시 건강해졌습니다.")
        else:
            print("치료를 포기하고 돌아갑니다.")

    def have_child(self):
        if not self.spouse: return print("배우자가 필요합니다.")
        child_name = input("아이 이름: ")
        # 유전 데이터 생성 (평균값 기반)
        inherited = {
            'int': self.intelligence,
            'cre': self.creativity
        }
        child = Sim(child_name, generation=self.generation+1, money=0, inherited_stats=inherited)
        self.children.append(child)
        self.money -= 1500
        print(f"👶 {child_name}에게 지능({child.intelligence})과 예술성({child.creativity})이 유전되었습니다!")

def main():
    player = Sim(input("초대 심 이름: "))
    
    while True:
        while player.is_alive:
            player.show_status()
            print("1.일하기  2.휴식  3.배우자찾기  4.자녀낳기  5.병원가기  6.종료")
            cmd = input("행동: ")
            
            if cmd == '1': 
                player.money += 400
                player.energy -= 20
            elif cmd == '2': 
                player.energy = min(100, player.energy + 40)
                player.health = min(100, player.health + 5)
            elif cmd == '3':
                if not player.spouse: player.spouse = "NPC_" + str(random.randint(1,99))
            elif cmd == '4': player.have_child()
            elif cmd == '5': player.go_to_hospital()
            elif cmd == '6': return
            
            player.pass_time()

        if player.children:
            print("\n대를 이을 자녀를 선택하세요.")
            for i, c in enumerate(player.children): print(f"{i+1}. {c.name}")
            idx = int(input("> ")) - 1
            inheritance = player.money // 2
            player = player.children[idx]
            player.money = inheritance
        else:
            print("게임 오버.")
            break

if __name__ == "__main__":
    main()
import json
import random
import time
import os

# 성격 특성 정의 (영향력 설정)
TRAITS = {
    "천재": {"desc": "지성 상승폭 2배", "int_mod": 2.0, "salary_mod": 1.0},
    "운동가": {"desc": "에너지 소모량 0.5배", "energy_mod": 0.5, "salary_mod": 1.0},
    "게으름": {"desc": "잠잘 때 에너지 회복 1.5배, 업무 효율 0.8배", "sleep_mod": 1.5, "salary_mod": 0.8},
    "야심가": {"desc": "급여 1.5배, 허기짐 1.5배", "salary_mod": 1.5, "hunger_mod": 1.5},
    "사교적": {"desc": "친구 사귀기 효율 상승(추후 구현), 재미 하락 느림", "fun_mod": 0.7}
}

class Sim:
    def __init__(self, name, traits=None, money=1000, generation=1):
        self.name = name
        self.generation = generation
        self.money = money
        self.age = 20
        self.day = 1
        self.is_alive = True
        
        # 수치
        self.hunger = 50
        self.energy = 80
        self.intelligence = 10
        self.creativity = 10
        
        # 성격 (최대 2개)
        if traits:
            self.traits = traits
        else:
            self.traits = random.sample(list(TRAITS.keys()), 2)
            
        self.children = []

    def get_mod(self, trait_key, default=1.0):
        """특성에 따른 보정치 계산"""
        mod = default
        for t in self.traits:
            if trait_key in TRAITS[t]:
                mod *= TRAITS[t][trait_key]
        return mod

    def show_status(self):
        print(f"\n{'='*60}")
        print(f" [{self.generation}세대] {self.name} ({self.age}세) | 특성: {', '.join(self.traits)}")
        print(f" {TRAITS[self.traits[0]]['desc']} | {TRAITS[self.traits[1]]['desc']}")
        print(f"{'-'*60}")
        print(f" 🍎허기: {int(self.hunger):>3} | ⚡에너지: {int(self.energy):>3} | 💰자산: {self.money}원")
        print(f" 🧠지성: {self.intelligence:>3} | 🎨예술성: {self.creativity:>3}")
        print(f"{'='*60}")

    def work(self):
        salary = int(400 * self.get_mod("salary_mod"))
        self.money += salary
        self.energy -= (20 * self.get_mod("energy_mod"))
        self.hunger += (10 * self.get_mod("hunger_mod"))
        print(f"💼 업무 완료! {salary}원을 벌었습니다. (특성 반영됨)")

    def study(self):
        gain = int(10 * self.get_mod("int_mod"))
        self.intelligence += gain
        self.energy -= 15
        print(f"📚 공부를 하여 지성이 {gain}만큼 상승했습니다!")

    def sleep(self):
        recovery = int(40 * self.get_mod("sleep_mod"))
        self.energy = min(100, self.energy + recovery)
        self.day += 1
        if self.day % 5 == 0: self.age += 1
        print(f"🛌 숙면을 취했습니다. 에너지 +{recovery}")

    def to_dict(self):
        """객체를 딕셔너리로 변환 (저장용)"""
        return {
            "name": self.name,
            "generation": self.generation,
            "money": self.money,
            "age": self.age,
            "day": self.day,
            "hunger": self.hunger,
            "energy": self.energy,
            "intelligence": self.intelligence,
            "creativity": self.creativity,
            "traits": self.traits
        }

    @classmethod
    def from_dict(cls, data):
        """딕셔너리를 객체로 변환 (불러오기용)"""
        sim = cls(data['name'], traits=data['traits'], money=data['money'], generation=data['generation'])
        sim.age = data['age']
        sim.day = data['day']
        sim.hunger = data['hunger']
        sim.energy = data['energy']
        sim.intelligence = data['intelligence']
        sim.creativity = data['creativity']
        return sim

# --- 세이브/로드 엔진 ---
SAVE_FILE = "sims_save.json"

def save_game(sim, history):
    data = {
        "current_sim": sim.to_dict(),
        "history": history
    }
    with open(SAVE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print("💾 게임이 안전하게 저장되었습니다.")

def load_game():
    if not os.path.exists(SAVE_FILE):
        return None, []
    with open(SAVE_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    sim = Sim.from_dict(data['current_sim'])
    return sim, data['history']

# --- 메인 루프 ---
def main():
    print("✨ 텍스트 심즈 v0.6 - 성격과 기록 ✨")
    choice = input("1. 새로 시작  2. 불러오기: ")
    
    if choice == '2':
        player, history = load_game()
        if not player:
            print("저장된 파일이 없습니다. 새로 시작합니다.")
            player = Sim(input("초대 심 이름: "))
            history = []
    else:
        player = Sim(input("초대 심 이름: "))
        history = []

    while player.is_alive:
        player.show_status()
        print("1.일하기  2.공부하기  3.잠자기  4.저장하기  5.종료")
        cmd = input("행동: ")
        
        if cmd == '1': player.work()
        elif cmd == '2': player.study()
        elif cmd == '3': player.sleep()
        elif cmd == '4': save_game(player, history)
        elif cmd == '5': break
        
        # 기본 수치 감소
        player.hunger += (5 * player.get_mod("hunger_mod"))
        if player.hunger >= 100 or player.energy <= 0:
            print("💀 심이 너무 지치거나 굶주려 쓰러졌습니다...")
            player.is_alive = False

if __name__ == "__main__":
    main()
