--[[ Lua code. See documentation: https://api.tabletopsimulator.com/ --]]
BaseBagID = "d56658"
SSBagID = "8a1620"
TMBBagID = "f0fd33"
HMVBagID = "ba07f2"

tableHeight = 4

BaseBag = nil
SSBag = nil
TMBBag = nil
HMVBag = nil
SSState = nil
TMBState = nil
HMVState = nil

function init()
    BaseBag = getObjectFromGUID(BaseBagID)
    SSBag = getObjectFromGUID(SSBagID)
    TMBBag = getObjectFromGUID(TMBBagID)
    HMVBag = getObjectFromGUID(HMVBagID)
end

--[[ The onLoad event is called after the game save finishes loading. --]]
function onLoad()
    math.randomseed(os.time())
    init()
    --[[ print('onLoad!') --]]
    t = Tables.getTableObject()
    t.createButton({
        click_function = "setupSS",
        label = "Solar Sentinels",
        rotation = {0, 180, 0},
        position = {3, tableHeight, 0},
        width = 2500,
        height = 400,
        font_size = 340,
    })
    t.createButton({
        click_function = "setupTMB",
        label = "Too Many Bones",
        rotation = {0, 180, 0},
        position = {-3, tableHeight, 0},
        width = 2500,
        height = 400,
        font_size = 340,
    })
    t.createButton({
        click_function = "setupHMV",
        label = "Hoplomachus\nVictorum",
        rotation = {0, 180, 0},
        position = {-9, tableHeight, 0},
        width = 2500,
        height = 800,
        font_size = 340,
    })
    print("Select a game to setup")
end

--[[ The onUpdate event is called once per frame. --]]
function onUpdate()
    --[[ print('onUpdate loop!') --]]
end

function getAllFromBag(bag, nameDict, isList)
    ret = {}
    for _, o in ipairs(bag.getObjects()) do
        name = o.name
        obj = bag.takeObject({guid = o.guid})
        key = nameDict[name]
        if key != nil then
            if ret[key] == nil then
                if isList then
                    ret[key] = {obj}
                else
                    ret[key] = obj
                end
            else
                if isList then
                    ret[key][#ret[key] + 1] = obj
                else
                    print("double entry: " .. name)
                end
            end
        else
            -- default: place it back
            print("putting back: " .. name)
            bag.putObject(obj)
        end
    end
    return ret
end

function getBase()
    return getAllFromBag(BaseBag, {
        Dice = "dice",
        Chip = "chip",
        Rules = "rules",
        Phase = "phase"
    })
end

function getSS()
    return getAllFromBag(SSBag, {
        Enemies = "enemies",
        Hero = "hero",
        Overview = "overview",
        Rules = "rules",
        Boss = "boss",
        Missions = "missions",
        Counter = "counter"
    })
end

function getTMB()
    return getAllFromBag(TMBBag, {
        Enemies1 = "enemies1",
        Enemies5 = "enemies5",
        Encounter = "encounter",
        Hero = "hero",
        Universal = "universal",
        Overview = "overview",
        Rules = "rules",
        Boss = "boss",
        Day = "day"
    })
end

function getHMV()
    return getAllFromBag(HMVBag, {
        Conflict = "conflict",
        Scion = "scion",
        Hero = "hero",
        Tactic = "tactic",
        Overview = "overview",
        Rules = "rules",
    })
end

function hideButtons()
    t = Tables.getTableObject()
    for i, b in ipairs(t.getButtons()) do
        t.removeButton(i - 1)
    end
end

function placeDice(bag, poolPos, statPos)
    dice = getAllFromBag(bag, {
        Health = "health",
        Strategy = "strategy",
        Recovery = "recovery",
        Pink = "pink",
        Purple = "purple",
        Blue = "blue",
        Green = "green",
        Yellow = "yellow"
    }, true)
    for name, objs in pairs(dice) do
        for i, obj in ipairs(objs) do
            pos = nil
            -- Stat Dice
            if name == "health" then
                pos = {statPos.x, tableHeight, statPos.y}
            elseif name == "strategy" then
                pos = {statPos.x, tableHeight, statPos.y - 1}
            elseif name == "recovery" then
                pos = {statPos.x, tableHeight, statPos.y - 2}
            -- Dice Pool
            elseif name == "pink" then
                pos = {poolPos.x, tableHeight, poolPos.y}
            elseif name == "purple" then
                pos = {poolPos.x + ((i-1)%2), tableHeight, poolPos.y - 1 - math.floor((i-1)/2)}
            elseif name == "blue" then
                pos = {poolPos.x + ((i-1)%2), tableHeight, poolPos.y - 3 - math.floor((i-1)/2)}
            elseif name == "green" then
                pos = {poolPos.x + ((i-1)%2), tableHeight, poolPos.y - 5 - math.floor((i-1)/2)}
            elseif name == "yellow" then
                pos = {poolPos.x + ((i-1)%2), tableHeight, poolPos.y - 7 - math.floor((i-1)/2)}
            end
            if pos != nil then
                obj.setPosition(pos)
            else
                print("invalid pos")
            end
        end
    end
end

function setupSS(obj, player_clicker_color, alt_click)
    hideButtons()
    print("Setting up Solar Sentinels...")
    SSState = {}
    tl = {x = -5, y = 10}
    base = getBase()
    base.rules.setPosition({tl.x, tableHeight, tl.y})
    base.rules.setRotation({0, 180, 0})
    base.chip.setPosition({tl.x + 5, tableHeight, tl.y + 5})
    base.chip.setRotation({0, 180, 180}) -- flip, cause that doesnt work
    base.dice.setPosition({tl.x - 5, tableHeight, tl.y})
    placeDice(base.dice, {x = tl.x - 0.5, y = tl.y - 8}, {x = tl.x + 3.5, y = tl.y - 9})
    base.phase.setPosition({tl.x, tableHeight, tl.y - 22})
    base.phase.setRotation({0, 180, 0})
    ss = getSS()
    ss.rules.setPosition({tl.x, tableHeight, tl.y - 5})
    ss.rules.setRotation({0, 180, 0})
    -- Enemy
    ss.enemies.setPosition({tl.x + 5, tableHeight, tl.y - 15})
    ss.enemies.setRotation({0, 180, 0})
    ss.enemies.flip()
    ss.enemies.shuffle()
    -- Split into 3 and place evenly
    stacks = ss.enemies.split(3)
    SSState.enemies = stacks
    stacks[1].setPosition({tl.x + 10, tableHeight, tl.y - 15})
    stacks[1].setRotation({0, 180, 0})
    stacks[1].flip()
    stacks[2].setPosition({tl.x + 15, tableHeight, tl.y - 15})
    stacks[2].flip()
    -- Hero
    ss.hero.setPosition({tl.x + 20, tableHeight, tl.y - 10})
    ss.hero.setRotation({0, 180, 0})
    -- Overview
    ss.overview.setPosition({tl.x, tableHeight, tl.y - 18.5})
    ss.overview.flip()
    -- Boss
    ss.boss.setPosition({tl.x + 15, tableHeight, tl.y})
    ss.boss.setRotation({0, 180, 0})
    ss.boss.flip()
    ss.boss.shuffle()
    -- Counter
    ss.counter.setPosition({tl.x + 5, tableHeight, tl.y})
    ss.counter.setRotation({0, 180, 0})
    -- Missions
    ss.missions.setPosition({tl.x + 20, tableHeight, tl.y})
    ss.missions.setRotation({0, 180, 0})
    ss.missions.flip()
    ss.missions.shuffle()
    -- Open 4 missions
    SSState.missions = {}
    for i = 1, 4 do 
        card = ss.missions.takeObject()
        card.setPosition({tl.x + 5*i, tableHeight, tl.y - 5})
        card.flip()
        SSState.missions[#SSState.missions + 1] = card
    end
    -- Snap Points
    Global.setSnapPoints({{
        position = {tl.x + 6.5, tableHeight - 3, tl.y - 10}
    }})
    -- Finish Button
    t = Tables.getTableObject()
    t.createButton({
        click_function = "finishSS",
        label = "Finish",
        rotation = {0, 180, 0},
        position = {-5, tableHeight, tl.y - 18.5},
        width = 2500,
        height = 400,
        font_size = 340,
    })
    print("Select a hero and then press the button to finish setup.")
end

function finishSS(obj, player_clicker_color, alt_click)
    hideButtons()
    -- Flip enemies
    for _, stack in ipairs(SSState.enemies) do
        stack.flip()
    end
    -- Flip missions
    for _, card in ipairs(SSState.missions) do
        card.flip()
    end
    -- TODO: init stats?
    print("Finished setup!")
    print("Discard one open mission.")
end

function setupTMB(obj, player_clicker_color, alt_click)
    hideButtons()
    print("Setting up Too Many Bones...")
    TMBState = {}
    tl = {x = -5, y = 10}
    base = getBase()
    base.rules.setPosition({tl.x, tableHeight, tl.y})
    base.rules.setRotation({0, 180, 0})
    base.chip.setPosition({tl.x + 5, tableHeight, tl.y + 5})
    base.chip.setRotation({0, 180, 180}) -- flip, cause that doesnt work
    base.dice.setPosition({tl.x - 5, tableHeight, tl.y})
    placeDice(base.dice, {x = tl.x - 0.5, y = tl.y - 8}, {x = tl.x + 3.5, y = tl.y - 4})
    base.phase.setPosition({tl.x, tableHeight, tl.y - 22})
    base.phase.setRotation({0, 180, 0})
    tmb = getTMB()
    tmb.rules.setPosition({tl.x, tableHeight, tl.y - 5})
    tmb.rules.setRotation({0, 180, 0})
    -- Enemy
    TMBState.unusedPos = {tl.x + 20, tableHeight, tl.y}
    TMBState.encounter = tmb.encounter
    TMBState.enemies1 = tmb.enemies1
    TMBState.enemies5 = tmb.enemies5
    tmb.encounter.setPosition({tl.x + 5, tableHeight, tl.y - 15})
    tmb.encounter.setRotation({0, 180, 0})
    tmb.encounter.flip()
    tmb.enemies1.setPosition({tl.x + 10, tableHeight, tl.y - 15})
    tmb.enemies1.setRotation({0, 180, 0})
    tmb.enemies1.flip()
    tmb.enemies1.shuffle()
    tmb.enemies5.setPosition({tl.x + 15, tableHeight, tl.y - 15})
    tmb.enemies5.setRotation({0, 180, 0})
    tmb.enemies5.flip()
    tmb.enemies5.shuffle()
    -- Counter
    tmb.day.setPosition({tl.x + 5, tableHeight, tl.y})
    tmb.day.setRotation({0, 180, 0})
    -- Hero
    tmb.hero.setPosition({tl.x + 20, tableHeight, tl.y - 5})
    tmb.hero.setRotation({0, 180, 0})
    tmb.universal.setPosition({tl.x + 25, tableHeight, tl.y - 5})
    tmb.universal.setRotation({0, 180, 0})
    -- Overview
    tmb.overview.setPosition({tl.x, tableHeight, tl.y - 18.5})
    tmb.overview.flip()
    -- Boss
    tmb.boss.setPosition({tl.x + 15, tableHeight, tl.y})
    tmb.boss.setRotation({0, 180, 0})
    tmb.boss.flip()
    -- Snap Points
    Global.setSnapPoints({
        {position = {tl.x + 11, tableHeight - 3, tl.y}}, -- boss
        {position = {tl.x + 6.5, tableHeight - 3, tl.y - 5}}, -- hero
        {position = {tl.x + 5, tableHeight - 3, tl.y - 10}}, -- scouted encounter
        {position = {tl.x + 10, tableHeight - 3, tl.y - 10}}, -- scouted 1pt
        {position = {tl.x + 15, tableHeight - 3, tl.y - 10}}, -- scouted 5pt
    })
    -- Finish Button
    t = Tables.getTableObject()
    t.createButton({
        click_function = "finishTMB",
        label = "Finish",
        rotation = {0, 180, 0},
        position = {-5, tableHeight, tl.y - 18.5},
        width = 2500,
        height = 400,
        font_size = 340,
    })
    print("Select a tyrant and a gearloc and then press the button to finish setup.")
end

function finishTMB(obj, player_clicker_color, alt_click)
    hideButtons()
    -- TODO: remove tyrant cards according to difficulty
    tyrantCards = {}
    for _, o in ipairs(TMBState.encounter.getObjects()) do
        for _, tag in ipairs(o.tags) do
            if tag == "tyrant" then
                tyrantCards[#tyrantCards + 1] = o.guid
                break
            end
        end
    end
    for i = 1, 4 do
        index = math.random(1, #tyrantCards)
        card = TMBState.encounter.takeObject({guid = tyrantCards[index]})
        card.setPosition(TMBState.unusedPos)
        table.remove(tyrantCards, index)
    end
    TMBState.encounter.shuffle()
    -- flip stacks
    TMBState.encounter.flip()
    TMBState.enemies1.flip()
    TMBState.enemies5.flip()
    print("Finished setup!")
end

function setupHMV(obj, player_clicker_color, alt_click)
    hideButtons()
    print("Setting up Hoplomachus Victorum...")
    HMVState = {}
    tl = {x = -5, y = 10}
    base = getBase()
    base.rules.setPosition({tl.x, tableHeight, tl.y})
    base.rules.setRotation({0, 180, 0})
    base.chip.setPosition({tl.x + 5, tableHeight, tl.y + 5})
    base.chip.setRotation({0, 180, 180}) -- flip, cause that doesnt work
    base.dice.setPosition({tl.x - 5, tableHeight, tl.y})
    placeDice(base.dice, {x = tl.x - 0.5, y = tl.y - 8}, {x = tl.x + 17, y = tl.y - 4})
    base.phase.setPosition({tl.x, tableHeight, tl.y - 22})
    base.phase.setRotation({0, 180, 0})
    hmv = getHMV()
    HMVState.components = hmv
    HMVState.unusedPos = {x = tl.x + 20, y = tl.y + 5}
    hmv.rules.setPosition({tl.x, tableHeight, tl.y - 5})
    hmv.rules.setRotation({0, 180, 0})
    -- Overview
    hmv.overview.setPosition({tl.x, tableHeight, tl.y - 18.5})
    hmv.overview.flip()
    -- Scion
    hmv.scion.setPosition({tl.x + 15, tableHeight, tl.y})
    hmv.scion.setRotation({0, 180, 0})
    hmv.scion.flip()
    -- Conflict
    hmv.conflict.setPosition({tl.x + 20, tableHeight, tl.y})
    hmv.conflict.setRotation({0, 180, 0})
    -- Tactic
    hmv.tactic.setPosition({tl.x + 25, tableHeight, tl.y})
    hmv.tactic.setRotation({0, 180, 0})
    -- Hero
    hmv.hero.setPosition({tl.x + 30, tableHeight, tl.y})
    hmv.hero.setRotation({0, 180, 0})
    -- Snap Points
    xOffset = 5
    yOffset = 5
    rowOffset = 2
    HMVState.stackPositions = {
        {tl.x + 4, tableHeight - 3, tl.y - yOffset * 3},
        {tl.x + 4 + xOffset, tableHeight - 3, tl.y - yOffset * 3},
        {tl.x + 4 + xOffset * 2, tableHeight - 3, tl.y - yOffset * 3},
        {tl.x + 4 + xOffset * 3, tableHeight - 3, tl.y - yOffset * 3},
        {tl.x + 4 + rowOffset, tableHeight - 3, tl.y - yOffset * 2},
        {tl.x + 4 + rowOffset + xOffset, tableHeight - 3, tl.y - yOffset * 2},
        {tl.x + 4 + rowOffset + xOffset * 2, tableHeight - 3, tl.y - yOffset * 2},
        {tl.x + 4 + rowOffset * 2, tableHeight - 3, tl.y - yOffset},
        {tl.x + 4 + rowOffset * 2 + xOffset, tableHeight - 3, tl.y - yOffset}
    }
    HMVState.tacticAreaPos = {tl.x + 25, tableHeight - 3, tl.y - 5}
    HMVState.trainingGroundsPos = {x = tl.x + 22.5, y = tl.y}
    HMVState.heroPos = {tl.x + 20, tableHeight - 3, tl.y - 5}
    Global.setSnapPoints({
        {position = {tl.x + 10, tableHeight - 3, tl.y}}, -- scion
        {position = {tl.x + 4, tableHeight - 3, tl.y}}, -- scion influence
        {position = {tl.x + 20, tableHeight - 3, tl.y}}, -- discard
        {position = HMVState.heroPos}, -- hero
        {position = HMVState.tacticAreaPos}, -- tactic area
        {position = HMVState.stackPositions[1]}, -- 1
        {position = HMVState.stackPositions[2]}, -- 2
        {position = HMVState.stackPositions[3]}, -- 3
        {position = HMVState.stackPositions[4]}, -- 4, next row
        {position = HMVState.stackPositions[5]}, -- 5
        {position = HMVState.stackPositions[6]}, -- 6
        {position = HMVState.stackPositions[7]}, -- 7, next row
        {position = HMVState.stackPositions[8]}, -- 8
        {position = HMVState.stackPositions[9]}, -- 9, end
    })
    -- Next Button
    t = Tables.getTableObject()
    t.createButton({
        click_function = "setupHMV2",
        label = "Next Step",
        rotation = {0, 180, 0},
        position = {-5, tableHeight, tl.y - 10},
        width = 2500,
        height = 400,
        font_size = 340,
    })
    HMVState.heroSelectionPos = {x = tl.x + 4, y = tl.y - 22}
    print("Select a scion and then press the button to go to the next step.")
end

function setupHMV2()
    hideButtons()
    unused = HMVState.unusedPos
    -- remove unused scions
    HMVState.components.scion.setPosition({unused.x, tableHeight, unused.y})
    -- build tree
    conflict = HMVState.components.conflict
    conflict.shuffle()
    decks = conflict.split(9)
    Wait.frames(function() 
        for k,v in ipairs(decks) do
            pos = HMVState.stackPositions[k]
            v.setPosition({pos[1], tableHeight, pos[3]})
            v.setRotation({0, 180, 0})
        end
    end, 1)
    -- tactic
    HMVState.components.tactic.setPosition({HMVState.tacticAreaPos[1], tableHeight, HMVState.tacticAreaPos[3]})
    --give 4 random heroes 
    HMVState.components.hero.shuffle()
    HMVState.heroes = {}
    for i = 1, 4 do
        card = HMVState.components.hero.takeObject({index = i})
        card.setPosition({HMVState.heroSelectionPos.x + (i-1)*5, tableHeight, HMVState.heroSelectionPos.y})
        card.setRotation({180,-90,0})
        table.insert(HMVState.heroes, card)
    end
    -- move remaining heroes
    HMVState.components.hero.setPosition({unused.x + 5, tableHeight, unused.y})
    -- move remaining dice to training grounds (2 purple, 2 blue, 2 green, 2 yellow)
    for k,v in ipairs({"Purple", "Blue", "Green", "Yellow"}) do
        objs = getObjects()
        colored = {}
        for k2,v2 in ipairs(objs) do
            if v2.getName() == v then
                table.insert(colored, v2)
            end
        end
        for i = 1, 2 do
            colored[i].setPosition({HMVState.trainingGroundsPos.x+k, tableHeight, HMVState.trainingGroundsPos.y-i})
        end
    end
    -- Finish Button
    t = Tables.getTableObject()
    t.createButton({
        click_function = "finishHMV",
        label = "Finish",
        rotation = {0, 180, 0},
        position = {-5, tableHeight, tl.y - 18.5},
        width = 2500,
        height = 400,
        font_size = 340,
    })
    print("Select a hero and a starting tactic and then press the button to finish setup.")
end

function finishHMV(obj, player_clicker_color, alt_click)
    count = 0
    for k,v in ipairs(HMVState.heroes) do
        if math.floor(v.getPosition().x) ~= HMVState.heroPos[1] or math.floor(v.getPosition().z) ~= HMVState.heroPos[3] then
            count = count + 1
        end
    end
    if count > 3 then
        print("Put the selected hero into the corresponding snap zone (next to the stat dice)")
        return
    end
    hideButtons()
    -- place remaining heroes as primus
    camps = {1, 6, 9}
    index = 1
    for k,v in ipairs(HMVState.heroes) do
        if math.floor(v.getPosition().x) ~= HMVState.heroPos[1] or math.floor(v.getPosition().z) ~= HMVState.heroPos[3] then
            v.setRotation({0,180,0})
            pos = HMVState.stackPositions[camps[index]]
            v.setPosition({pos[1], pos[2], pos[3]+1.5})
            index = index + 1
        end
    end
    print("Finished setup!")
end