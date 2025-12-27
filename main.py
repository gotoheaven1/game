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
