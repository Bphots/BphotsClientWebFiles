"use strict";

var isIE = function (ver) {
  var b = document.createElement('b')
  b.innerHTML = '<!--[if IE ' + ver + ']><i></i><![endif]-->'
  return b.getElementsByTagName('i').length === 1
}
var v = 5, l = 10, isSupportted = true
for (; v <= l; v++) {
  if (isIE(v)) {
    isSupportted = false
    alert('背锅助手需要更新的 IE 版本，请升级到 IE11 或以上。当前版本：IE' + v)
  }
}
var emptyTagList = [{
  'key': 'role',
  'value': []
}, {
  'key': 'universe',
  'value': []
}, {
  'key': 'subclass',
  'value': []
}]
function isUndefined(target) {
  return typeof target === 'undefined'
}
function callInvoker(method, params) {
  if (isUndefined(window.CallbackObject) ||
    isUndefined(window.CallbackObject.callback)) {
    return false
  }
  console.log(method)
  console.log(params)
  //params.unshift(method)
  window.CallbackObject.callback(method, params)
}

isSupportted && (function (exports) {

  Vue.config.devtools = true

  var bph = new Vue({
    el: '#app',
    data: {
      ignore: window.ignore || false,  //服务端不统计
      debug: window.debug || false,  //调试模式开关
      queryApi: window.queryApi || '',  //API 地址
      mmrApi: window.mmrApi || '',  //API 地址
      tipsApi: window.tipsApi || '',  //API 地址
      bpQueue: window.bpQueue || [],  //BP 顺序
      sides: ['left', 'right'],  //颜色方向,
      heroList: window.heroList || [],  //英雄列表
      mapList: window.mapList || [],  //地图列表
      chose: [],
      langDefault: window.lang || 'en-US',
      lang: window.lang || '',
      langMessage: window.lang || '',
      langGameClient: window.lang || '',
      isLong: window.isLong,
      enDictNumber: window.enDictNumber,
      advices: [],  //推荐信息
      talent: [], //天赋信息
      adviceHeroID: null,  //英雄细览序号
      map: null,  //当前地图
      channel: null,  //频道
      // waiting: !debug,
      waiting: true,
      teamFirst: null,  //先选方
      // index: 0,  //当前 BP 序号
      doTransition: true,
      isLongName: false,
      searchHero: '',
      curSelect: '',
      paramsTmp: [],
      animator: {
        timer: null,
        idx: -2
      },
      evaluateKey: '',
      verified: true,
      needUpdate: false,
      copied: false,
      copiedReason: false,
      informList: [],
      bulletList: [],
      bulletContainer: null,
      bulletIndex: -1,
      stepSelected: {},
      isShowStepInfo: false,
      isSwitchOn: false, // tag开关
      tagList: [], // tag列表
      selectedTagList: emptyTagList, //已选tag列表
      tempTagList: emptyTagList, // 临时的已选tag列表
      filterList: emptyTagList, // 已筛选的tag列表
      isListOn: false, // tag列表是否打开
      filterTagCount: 0,
      selectedTagCount: 0,
      updateData: {}, // handleAdvice的数据
      tags: window.tags, // tag标签名称
      isUpdateBp: false,
      advicesDefault: [], // 默认tag
      lastAdviceData: null,
      altText: ''
    },
    watch: {
      isListOn(newVal) {
        if (newVal === true) {
          this.tempTagList = JSON.parse(JSON.stringify(this.selectedTagList))
        }
      }
    },
    computed: {
      bpQueueFiltered: function () {
        var bpQueue = this.bpQueue
        var left = []
        var right = []
        var bqf = {}
        for (var _i in bpQueue) {
          var _step = bpQueue[_i]
          if (_step.action === 'ban') {
            continue
          }
          _step.idx = _i
          if (_step.team === 0) {
            left.push(_step)
          } else {
            right.push(_step)
          }
        }
        bqf = {
          left: left,
          right: right
        }
        return bqf
      },
      boxTitle: function () {
        var title = ''
        if (this.map && this.lang) {
          title = '[' + this.mapList[this.map].name[this.lang] + ']'
        } else if (this.lang) {
          title = this.langs['Waiting for BP']
        }
        return title
      },
      langs: function () {   //语言类型
        this.lang = this.lang || this.langDefault
        return window.langs[this.lang]
      },
      teamPos: function () {
        var teamPos = this.teamFirst == 0 ? ['left', 'right'] : ['right', 'left']
        return teamPos
      },
      title: function () {
        if (!this.map) {
          return ''
        }
        var title = [this.mapList[this.map].name[this.lang], this.langs[this.teamPos[0]], this.langs['first']].join(' ')
        return title
      },
      filteredAdvice: function () {
        lang = this.lang
        var filteredAdvice = { '1': [], '2': [], '3': [] },
          advices = this.advices, index = this.chose.length,
          advice = advices[index], i
        for (i in advice) {
          advice[i].idx = i
          advice[i].name = this.heroList[advice[i].id].name[lang]
          filteredAdvice[advice[i]['tier']].push(advice[i])
        }
        this.adviceHeroID = advice && advice[0] && advice[0].id
        return filteredAdvice
      },
      adviceDetail: function () {
        lang = this.lang
        var advices = this.advices, index = this.chose.length,
          advice = advices[index], i
        for (i in advice) {
          if (advice[i].id === this.adviceHeroID) {
            advice[i].name = this.heroList[advice[i].id].name[lang]
            advice[i].portrait = 'statics/portrait/' + this.heroList[advice[i].id].basic + '.png'
            advice[i].bg = 'statics/bg/' + this.heroList[advice[i].id].basic + '.png'
            this.isLongName = advice[i].name.full.length > this.isLong[lang]
            return advice[i]
          }
        }
        return {}
      },
      reasonText: function () {
		var langs = window.langs[this.langMessage]
        var stepSelected = this.stepSelected
        var heroID = stepSelected.heroID
        if (!heroID) {
          return ''
        }
        var heroList = this.heroList
        var talent = this.talent
        return [
          '[' + heroList[heroID].name[this.langMessage].full + ']',
          langs['Popular Talent'],
          talent[heroID],
          '- ' + langs['from'] + langs['BpHelper']
        ].join(' ')
      },
      filteredHeroList: function () {
        lang = this.lang
        var heroList = this.heroList,
          searchHero = this.searchHero.toLowerCase(),
          chose = this.chose,
          fhl = {}, i
        for (i in heroList) {
          if (chose.indexOf(i) === -1) {
            if (!!searchHero) {
              if (heroList[i].name[lang].full.toLowerCase().indexOf(searchHero) !== -1) {
                fhl[i] = heroList[i]
                fhl[i].id = i
              }
            } else {
              fhl[i] = heroList[i]
              fhl[i].id = i
            }
          }
        }
        fhl = this._sortByLocale(fhl, 'asc')
        if (fhl.length > 0) {
          this.curSelect = fhl[0].id
        }
        return fhl
      },
      queryUrl: function () {
        var url = this.queryApi + '?lang=' + this.lang + '&map=' + this.map + '&chose=' + this.chose.join('|')
        if (this.ignore || this.debug) url = url + '&ignore=1'
        console.log(url);
        return url
      }
    },
    methods: {
      getTagStyle: function (item, sel) {
        return sel.value.indexOf(item.val) > -1 ? "box-shadow: 0 0 8px 0 " + item.color + "; border: 1px solid " + item.color : 'auto'
      },
      preset: function (heroList, mapList) {
        this.heroList = JSON.parse(heroList)
        this.mapList = JSON.parse(mapList)
      },
      init: function (teamFirst, lang, langMessage, langGameClient) {
        if (!this.verified) {
          console.log('Unverified')
          return false
        }
        if (this.heroList.length === 0 || this.mapList.length === 0) {
          console.log('No hero list / map list')
          return false
        }
        this.cancelSelectedTag()
        this.isSwitchOn = false
        this.advicesDefault = []
        this.waiting = true
        var presetLang = this.lang
        this.lang = window.langs[lang] ? lang : this.langDefault
        this.langMessage = window.langs[langMessage] ? langMessage : this.langDefault
        this.langGameClient = window.langs[langGameClient] ? langGameClient : this.langDefault
        if (presetLang !== this.lang) {
          this._getJSONP(informApi + '?mode=1&lang=' + this.lang + '&callback=handleInform')
        }
        this.langs = window.langs[this.lang]
        this.teamFirst = teamFirst !== undefined ? teamFirst : Math.round(Math.random())
        var bpQueue = this.bpQueue
        for (var i in bpQueue) {
          this.$set(bpQueue[i], 'heroID', null)
        }
        this.chose = []
        this.advices = []
        if (this.debug) {
          this.update('', lang)
        }
      },
      update: function (_chose, map, lang, timestamp, client_patch, nonce, sign) {
        this.updateData = [
          _chose,
          map,
          lang,
          timestamp,
          client_patch,
          nonce,
          sign
        ];
        if (!this.verified) { return false }
        this.chose = _chose === '' ? [] : _chose.split('|')
        var chose = this.chose
        if (chose.length > 16) {
          return false
        }
        if (this.mapList[map]) {
          this.map = map
        } else {
          console.log('Wrong map name: ' + map)
          return false
        }
        var bpQueue = this.bpQueue
        for (var i in bpQueue) {
          if (chose[i]) {
            this.$set(bpQueue[i], 'heroID', chose[i])
          } else {
            this.$set(bpQueue[i], 'heroID', null)
          }
        }
        if (chose.length <= 16) {
          this.queryAdvice(timestamp, client_patch, nonce, sign)
        }
        if (this.isUpdateBp === false) {
          //
        }
      },
      queryAdvice: function (timestamp, client_patch, nonce, sign) {
        this.copied = false
        timestamp = timestamp || (new Date().getTime() + '').substr(0, 10)
        var params = [
          "timestamp=" + timestamp,
          "client_patch=" + client_patch,
          "nonce=" + nonce,
          "sign=" + sign,
          "callback=handleAdvice"
        ];
        this.paramsTmp = params;
        (function (self, index, params) {
          self._getJSONP(self.queryUrl + '&' + params.join('&'))
        }(this, this.chose.length, params))
        this.animator.idx = -2
      },
      hotsMakeTiersData(data) { // rebuild
        var index = 0;
        var delta = 5;
        var each_row = 3;
        var data_count = data.length;

        // T1
        var tier = 1;
        var max = each_row * 2;
        var result = [];
        result[tier] = [];
        var point_max = [];
        if (index < data_count) {
          point_max[tier] = data[index][1];
          do {
            if (data[index][1] > 0)
              result[tier].push(data[index]);
            index++;
            if (index >= data_count)
              break;
          } while (result[tier].length < max && point_max[tier] - data[index][1] <= delta);
        }

        // T2
        tier = 2;
        max = result[1].length > each_row ? each_row : each_row * 2;
        result[tier] = [];
        if (index < data_count) {
          point_max[tier] = data[index][1];
          do {
            if (data[index][1] > 0)
              result[tier].push(data[index]);
            index++;
            if (index >= data_count)
              break;
          } while (result[tier].length < max && (point_max[tier] - data[index][1] <= delta || result[tier - 1].length > each_row));
        }

        // T3
        if (!(result[1].length > each_row || result[2].length > each_row)) {
          tier = 3;
          max = each_row;
          result[tier] = [];
          if (index < data_count) {
            do {
              result[tier].push(data[index]);
              index++;
              if (index >= data_count)
                break;
            } while (result[tier].length < max);
          }
        }

        return result;
      },
      matchingTagOr: function (indexList, isSelected, item) {
        for (let index of indexList) {
          if (isSelected[index]) {
            for (let index of indexList) {
              if (this.matchingTag(index, isSelected, item) && isSelected[index]) return true
            }
            return false
          }
        }
        return true
      },
      matchingTag: function (index, isSelected, item) {
        if (isSelected[index]) {
          return this.selectedTagList[index].value.indexOf(this.heroList[item].tags[index].value) > -1
        }
        return true
      },
      handleAdvice: function (data) {
        var newHeroList = [];
        var newAdvice = [];
        let isSelected = [];
        isSelected[0] = this.selectedTagList[0].value.length > 0;
        isSelected[1] = this.selectedTagList[1].value.length > 0;
        isSelected[2] = this.selectedTagList[2].value.length > 0;
        for (let item in this.heroList) {
          // role + subclass
          // universe
          if (this.matchingTagOr([0, 2], isSelected, item) && this.matchingTag(1, isSelected, item)) {
              newHeroList.push(item);
          }
        }
        for (let item of newHeroList) {
          let temp = data.advice.find((val) => {
            return val[0] === parseInt(item);
          });
          if (typeof (temp) != "undefined") newAdvice.push(temp);
        }
        newAdvice = newAdvice.sort((a, b) => {
          if (a[1] < b[1]) {
            return 1;
          }
          if (a[1] > b[1]) {
            return -1;
          }
          return 0;
        });
        // console.log(newAdvice);
        this.waiting = false;
        if (!data.result) {
          this.lastAdviceData = data
          let tier;
          let tierFiltered = this.hotsMakeTiersData(newAdvice);
          let tierOriginal = this.hotsMakeTiersData(data.advice);
          if ((this.selectedTagList[0].value.length > 0 || this.selectedTagList[1].value.length > 0 || this.selectedTagList[2].value.length > 0) && this.isSwitchOn) {
            tier = tierFiltered
          } else {
            tier = tierOriginal
          }
          let ori_advice = [];
          for (let items = 1, length = tierOriginal.length; items < length; items++) {
            for (let item of tierOriginal[items]) {
              ori_advice.push({
                id: item[0],
                name: this.heroList[item[0]].name[lang].full,
                tier: items,
                point: item[1]
              })
            }
          }
          let new_advice = [];
          for (let items = 1, length = tier.length; items < length; items++) {
            for (let item of tier[items]) {
              new_advice.push({
                id: item[0],
                name: this.heroList[item[0]].name[lang].full,
                tier: items,
                point: item[1]
              })
            }
          }
          this.$set(this.advices, this.chose.length, new_advice);
          if (this.isUpdateBp === false) {
            this.advicesDefault[this.chose.length] = ori_advice;
          } else {
            this.isUpdateBp = false;
          }
          this.talent = data.talent;
        } else if (data.result === 'failure'
          && (data.group === 'check_token_temp' || data.group === 'check_ip_requset')
          && data.error_id === 1) {
          (function (self, index, params) {
            setTimeout(function () {
              self._getJSONP(self.queryUrl + '&' + params.join('&'))
            }, 1000)
          })(this, this.chose.length, this.paramsTmp)
        } else if (data.group === 'check_source' && data.error_id === 1) {
          this.needUpdated = true
          // } else if (data.group === 'check_private_test_limit' && data.error_id === 1) {
          //   this.verified = false
        } else if (data.group === 'advice' && data.error_id === 1) {
          alert(data.error)
          this.revert()
        } else {
          alert(data.error)
        }
      },
      getQueueClass: function (pos) {
        var teamPos = this.teamPos
        var clazz = [pos]
        if (teamPos[0] === pos) {
          clazz.push('blue')
        } else {
          clazz.push('red')
        }
        return clazz
      },
      getStepClass: function (stepIndx) {
        var chose = this.chose
        var clazz = []
        if (stepIndx >> 0 === chose.length) {
          clazz.push('active')
        }
        if (stepIndx < chose.length) {
          clazz.push('selected')
        }
        return clazz.join(' ')
      },
      getStepName: function (stepIndx) {
        lang = this.lang
        if (this.chose.length === stepIndx) {
          return this.langs['current']
        }
        var step = bpQueue[stepIndx]
        if (step.heroID && this.heroList[step.heroID]) {
          if (lang === 'en-US') {
            var str = [
              this.enDictNumber[step.pos],
              this.langs[step.action],
              this.heroList[step.heroID].name[lang].full
            ]
          } else {
            var str = [
              step.pos + ' ' + this.langs['move'],
              this.langs[step.action],
              this.heroList[step.heroID].name[lang].full
            ]
          }
          return str.join(' ')
        } else {
          return ''
        }
      },
      showStepInfo: function (step, e) {
        if (!step.heroID) {
          return false
        }
        clearTimeout(window.stoHideStep)
        if (e) {
          var target = e.target
          var stepInfoBox = this.$refs.stepInfoBox
          stepInfoBox.style.top = (target.offsetTop - 5) + 'px'
          stepInfoBox.style.left = (target.offsetLeft - 9) + 'px'
        }
        if (this.stepSelected.idx !== step.idx) {
          this.copiedReason = false
        }
        this.stepSelected = step
        this.isShowStepInfo = true
      },
      hideStepInfo: function () {
        var _self = this;
        (function () {
          window.stoHideStep = setTimeout(function () {
            _self.stepSelected = {}
            _self.isShowStepInfo = false
          }, 100)
        })()
      },
      _adviceRanking: function () {
        var langs = window.langs[this.langMessage]
        var bpQueue = this.bpQueue
        var chose = this.chose
        if (bpQueue.length === chose.length) {
          return false
        }
        var currentStep = this.bpQueue[this.chose.length]
        var stepInfo = [langs[this.teamPos[currentStep.team]]]
        var joinChar = ' '
        if (langs === 'en-US') {
          joinChar = ''
          stepInfo.push(this.enDictNumber[currentStep.pos])
        } else {
          stepInfo.push(currentStep.pos + ' ' + langs['move'])
        }
        stepInfo.push(langs[currentStep.action])
        var arr = [],
          advice = this.advicesDefault[this.chose.length]
        if (!advice) {
          return false
        }
        var i = 0, len = advice.length <= 6 ? advice.length : 6
        for (; i < len; i++) {
          var heroName = '[' + this.heroList[advice[i].id].name[this.langGameClient].full + ']'
          //arr.push(heroName + '(' + advice[i].point + ')')
          arr.push(advice[i].point + heroName)
        }
        return stepInfo.join(joinChar) + langs['recommend'] + ': ' + arr.join(', ') + ' - ' + langs['from'] + ' ' + langs['BpHelper']
      },
      _detailBg: function (bg) {
        var style = ''
        style += 'background-image: -webkit-linear-gradient(90deg, rgb(28, 18, 58) 30%, rgba(28, 18, 57, 0.4), rgb(28, 8, 35)), -webkit-linear-gradient(rgb(27, 17, 555),rgba(30, 21, 58, 0.4), rgb(28, 18, 57)), url(' + bg + ');'
        style += 'background-image: linear-gradient(90deg, rgb(28, 18, 58) 30%, rgba(28, 18, 57, 0.4), rgb(24, 8, 35)), linear-gradient(rgb(27, 17, 55), rgba(28, 18, 57, 0.4), rgb(30, 21, 58)), url(' + bg + ');'
        return style
      },
      _sortByLocale: function (collection, order) {
        var idxCollectionn = {}, sortCollection = [], result = [], i
        for (i in collection) {
          if (collection[i].name[lang]) {
            idxCollectionn[collection[i].name[lang].full] = collection[i]
            sortCollection.push(collection[i].name[lang].full)
          }
        }
        if (order.toLowerCase() === 'asc') {
          sortCollection.sort(
            function (a, b) {
              return a.localeCompare(b, lang)
            }
          )
        } else {
          sortCollection.sort(
            function (a, b) {
              return b.localeCompare(a, lang)
            }
          )
        }
        for (i in sortCollection) {
          result[i] = idxCollectionn[sortCollection[i]]
        }
        return result
      },
      checkValidation: function (e) {
        if (this.debug || this.ignore) return false
        e = e || window.event
        var keysBlock = [
          9,
          112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123
        ]
        if (((e.ctrlKey || e.altKey) && [65, 67, 86].indexOf(e.keyCode) === -1) ||
          keysBlock.indexOf(e.keyCode) !== -1) {
          e.preventDefault()
        }
      },
      postEvaluate: function () {
        this._getJSONP(evaluateApi + '?key=' + this.evaluateKey + '&callback=handleEvaluate')
        this.evaluateKey = ''
      },
      handleEvaluate: function (evaluate) {
        if (!evaluate.result) { return false }
        switch (evaluate.result) {
          case 'failure':
            if (evaluate.group === 'private_test_checkin' && evaluate.error_id === 1) {
              this.verified = true
              if (this.debug) {
                this.initRand()
              }
            } else if (!(evaluate.group === 'check_private_test_limit' && evaluate.error_id === 1)) {
              alert(evaluate.error)
            }
            break;
          case 'limited':
            break;
          case 'success':
          case 'allowed':
            this.verified = true
            if (this.debug) {
              this.initRand()
            }
            break;
        }
      },
      handleInform: function (informList) {
        if (!informList) {
          return false
        }
        if (informList.result === 'failure') {
          if (informList.error_id === 1 && informList.error === 'Over-demand.') {
            this._getJSONP(informApi + '?mode=1&lang=' + this.lang + '&callback=handleInform')
          }
          return false
        }
        this.resetBullet();
        this.informList = informList;
        var _self = this
        setTimeout(function () {
          _self.checkBulletOverflow()
        }, 0)
      },
      resetBullet: function () {
        this.bulletList = []
        clearTimeout(window.bo_a);
        clearTimeout(window.bo_b);
        clearTimeout(window.bo_c);
      },
      getAdviceClass: function (tier, length) {
        var adviceClass = {}
        adviceClass['t' + tier] = true
        if (length > 3) {
          adviceClass['flex2'] = true
        } else {
          adviceClass['flex1'] = true
        }
        return adviceClass
      },
      _getJSONP: function (url) {
        var newScript = document.createElement("script");
        newScript.setAttribute("type", "text/javascript");
        newScript.setAttribute("src", url);
        document.head.appendChild(newScript);
      },
      pick: function (heroId) {
        if (!!heroId) {
          if (this.chose.indexOf(heroId + '') === -1) {
            this.chose.push(heroId)
            this.update(this.chose.join('|'))
          }
        }
      },
      initRand: function () {
        return false
        var mapList = this.mapList
        var mapKeys = Object.keys(mapList)
        var rand = Math.ceil(Math.random() * mapKeys.length - 1)
        this.init(mapKeys[rand])
      },
      updateRand: function () {
        if (!this.map) {
          this.initRand()
        }
        var heroList = this.heroList
        var heroKeys = Object.keys(heroList)
        var rand = Math.ceil(Math.random() * heroKeys.length)
        if (this.chose.indexOf(heroKeys[rand]) === -1) {
          this.pick(heroKeys[rand])
        } else {
          this.updateRand()
        }
      },
      revert: function () {
        if (!!this.chose.length) {
          this.$set(this.advices, this.chose.length - 1, null)
          this.$set(this.bpQueue[this.chose.length - 1], 'heroID', null)
          this.chose.pop()
          this.queryAdvice()
        }
      },
      checkBulletOverflow: function () {
        this.bulletIndex += 1;
        this.bulletIndex = this.bulletIndex % this.bulletList.length
        var _self = this;
        var current = this.bulletList[this.bulletIndex];
        var container = this.bulletContainer;
        var speed = 30;
        var delay = 2000;
        var hold = 1000;
        var time = delay + hold;
        // alert(current.scrollWidth)
        if (current.scrollWidth > container.offsetWidth) {
          var extend = current.scrollWidth - container.offsetWidth
          var last = extend / speed
          time += last * 1000;
          container.style.transform = 'translateY(-' + (this.bulletIndex * 100) + '%)'
          current.style.transition = 'transform ' + last + 's linear';
          (function (current) {
            window.bo_a = setTimeout(function () {
              current.style.transform = 'translateX(-' + extend + 'px)';
            }, delay)
            window.bo_b = setTimeout(function () {
              current.style.transform = 'translateX(0)';
            }, time + delay)
          }(current))
        }
        (function (time) {
          window.bo_c = setTimeout(function () {
            _self.checkBulletOverflow();
          }, time);
        }(time))
      },
      // build by 卿家
      selectTag(key, val) {
        if (!this.selectedTagCount) this.selectedTagCount = this.filterTagCount
        if (this.selectedTagList[key].value.indexOf(val) > -1) {
          this.selectedTagCount--
          this.selectedTagList[key].value.splice(this.selectedTagList[key].value.indexOf(val), 1);
        } else {
          this.selectedTagCount++
          this.selectedTagList[key].value.push(val);
        }
      },
      addSelectedTag() {
        //if (!this.filterTagCount) this.isSwitchOn = true
        this.filterTagCount = this.selectedTagCount
        this.tempTagList = this.selectedTagList;
        this.filterList = this.selectedTagList;
        // this.selectedTagList[0].value = [2];
        //if (this.isSwitchOn === true) {
        this.isSwitchOn = !this.filterTagCount;
        this.startFilterTag();
        //}
        this.isListOn = false;
      },
      cancelSelectedTag() {
        this.selectedTagList = this.tempTagList;
        this.isListOn = false;
      },
      filterTag(...data) {
        //this.update(...data);
        this.handleAdvice(this.lastAdviceData)
      },
      startFilterTag() {
        this.isSwitchOn = !this.isSwitchOn;
        if (this.isSwitchOn === true && this.filterList.length !== 0) {
          this.selectedTagList = this.filterList;
          this.isUpdateBp = true;
          this.filterTag(...this.updateData);
        } else {
          this.filterTag(...this.updateData);
        }
      },
    },
    directives: {
      'bullet': {
        bind: function (el, binding, vnode) {
          vnode.context.bulletList.push(el);
        }
      },
      'bullet-container': {
        bind: function (el, binding, vnode) {
          vnode.context.bulletContainer = el;
        }
      }
    },
    beforeMount: function () {
      var _self = this
      if (!this.debug) {
        let that = this
        document.body.addEventListener('contextmenu', function (e) {
          if (that.ignore) return false
          e = e || window.event
          e.preventDefault()
        })
        document.body.addEventListener('keydown', function (e) {
          if (that.ignore) return false
          e = e || window.event
          e.preventDefault()
        })
      } else {
        document.body.addEventListener('keydown', function (e) {
          e = e || window.event
          if (e.keyCode === 39) {
            _self.pick(_self.adviceDetail.id)
          } else if (e.keyCode === 37) {
            _self.revert()
          }
        })
      }
      this._getJSONP(evaluateApi + '?action=test&callback=handleEvaluate')
      this._getJSONP(informApi + '?mode=1&lang=' + this.lang + '&callback=handleInform')
      callInvoker('RequestPreset')
    },
    mounted: function () {
      var _self = this;
      (function () {
        var advice = new Clipboard('#copy-advice')
        advice.on('success', function (e) {
          _self.copied = true
          setTimeout(function () {
            _self.copied = false
          }, 3000)
        })
        var reason = new Clipboard('.advice-detail-reason')
        reason.on('success', function (e) {
          _self.copiedReason = true
          setTimeout(function () {
            _self.copiedReason = false
          }, 1000)
        })
      }())
    },
    updated: function () {
      var _self = this;
      (function (_self) {
        _self.animator.timer = setTimeout(function () {
          if (_self.animator.idx < 9) {
            clearTimeout(_self.animator.timer)
            _self.animator.idx += 1
          }
        }, 50)
      })(_self)
    }
  })
  /*
  Preset 预设
  参数:
    heroList: 英雄列表
    mapList: 地图列表
  */
  exports.preset = bph.preset
  /*
  Init 初始化
  参数:
    map: 地图拼音首字母
    teamFirst: 先选方
    lang: 语言类型
  */
  exports.init = bph.init
  /*
  Update 更新 BP 信息
  参数:
    chose: 英雄 ID
    timestamp: 时间戳
    nonce: 随机字符
    sign: 校验码
    client_patch: 版本号
  */
  exports.update = bph.update
  exports.handleAdvice = bph.handleAdvice
  exports.handleEvaluate = bph.handleEvaluate
  exports.handleInform = bph.handleInform

}(window))