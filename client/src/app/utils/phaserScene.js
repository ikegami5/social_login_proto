import * as Phaser from 'phaser';

export class InitialScene extends Phaser.Scene {
  constructor(phaserRef) {
    super({ key: 'InitialScene', active: true });
    this.phaserRef = phaserRef;
  }
  create() {
    const buttonStyle = { fontSize: '16px', color: '#eee', backgroundColor: '#333' };
    const button = this.add.text(100, 100, 'Join Room: roomtest', buttonStyle);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => {
      this.phaserRef.current.handlers.onJoinRoom('roomtest');
    });
  }
}

export class PhaserScene extends Phaser.Scene {
    constructor(phaserRef, userIdRef) {
        super({ key: 'PhaserScene', active: false });
        this.phaserRef = phaserRef;
        this.userIdRef = userIdRef;
        this.roomState = null;
        this.avatarObjects = {};
        this.avatarRadius = 12;
        this.wallBounds = null;
        this.me = null;
        this.timer = null;
    }

    create() {
        console.log('PhaserScene create start');
        const fieldSize = 2000;
        const tileSize = 100;
        const wallColor = 0x444444;
        const wallThickness = 200;

        const graphics = this.add.graphics();
        for (let x = 0; x < fieldSize / tileSize; x++) {
            for (let y = 0; y < fieldSize / tileSize; y++) {
                graphics.fillStyle((x + y) % 2 === 0 ? 0xe0e0e0 : 0xffffff, 1);
                graphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }

        this.add.rectangle(fieldSize / 2, 0, fieldSize, wallThickness, wallColor).setOrigin(0.5, 0);
        this.add.rectangle(fieldSize / 2, fieldSize, fieldSize, wallThickness, wallColor).setOrigin(0.5, 1);
        this.add.rectangle(0, fieldSize / 2, wallThickness, fieldSize, wallColor).setOrigin(0, 0.5);
        this.add.rectangle(fieldSize, fieldSize / 2, wallThickness, fieldSize, wallColor).setOrigin(1, 0.5);

        Object.keys(this.roomState.avatars).forEach((userId) => {
            const avatar = this.roomState.avatars[userId];
            this.addAvatar(avatar, userId);
        });
        this.me = this.avatarObjects[this.userIdRef.current];

        this.cameras.main.startFollow(this.me.body, true);
        this.cameras.main.setBounds(0, 0, fieldSize, fieldSize);

        this.input.on('pointerdown', (pointer) => {
            const worldPoint = pointer.positionToCamera(this.cameras.main);
            const myAvatar = this.roomState.avatars[this.userIdRef.current];
            myAvatar.x = worldPoint.x;
            myAvatar.y = worldPoint.y;
        }, this);

        this.wallBounds = {
            left: wallThickness,
            right: fieldSize - wallThickness,
            top: wallThickness,
            bottom: fieldSize - wallThickness
        };

        this.timer = this.time.addEvent({
            delay: 500,
            callback: () => {
                this.phaserRef.current.handlers.onMoveAvatar(this.me.body.x, this.me.body.y);
            },
            callbackScope: this,
            loop: true
        });
    }
    
    update() {
        const userIdSet = new Set(Object.keys(this.roomState.avatars));
        Object.keys(this.avatarObjects).forEach((userId) => {
            const avatarObject = this.avatarObjects[userId];
            const avatar = this.roomState.avatars[userId];
            if (avatar) {
                this.moveAvatar(avatarObject, avatar);
                userIdSet.delete(userId);
            } else {
                delete this.avatarObjects[userId];
                this.deleteAvatar(avatarObject);
            }
        });
        userIdSet.forEach((userId) => {
            const avatar = this.roomState.avatars[userId];
            if (avatar) {
                this.addAvatar(avatar, userId);
            }
        });
    }

    moveAvatar(avatarObject, avatar) {
        const speed = 300;
        const body = avatarObject.body;
        const name = avatarObject.name;
        const dx = avatar.x - body.x;
        const dy = avatar.y - body.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 4) {
            const delta = this.game.loop.delta / 1000;
            const vx = (dx / distance) * speed * delta;
            const vy = (dy / distance) * speed * delta;

            const nextX = Phaser.Math.Clamp(
                body.x + vx,
                this.wallBounds.left + this.avatarRadius,
                this.wallBounds.right - this.avatarRadius
            );
            const nextY = Phaser.Math.Clamp(
                body.y + vy,
                this.wallBounds.top + this.avatarRadius,
                this.wallBounds.bottom - this.avatarRadius
            );

            body.setPosition(nextX, nextY);
            name.setPosition(nextX, nextY);
        }
    }

    addAvatar(avatar, userId) {
        const avatarObject = {
            body: this.add.circle(avatar.x, avatar.y, this.avatarRadius, 0x007bff),
            name: this.add.text(avatar.x, avatar.y, avatar.userName, {
                fontSize: '8px',
                color: '#fff',
                backgroundColor: '#007bff',
                align: 'center'
            }),
        };
        this.avatarObjects[userId] = avatarObject;
        return avatarObject;
    }

    deleteAvatar(avatarObject) {
        avatarObject.body.destroy();
        avatarObject.name.destroy();
    }
}
