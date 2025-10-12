(function(){
  const API_FUNCTIONS = ['SetSpeed','Rotate','RotateTo','Lift','LiftTo','GetAngle','GetHeight','IsSafe'];
  const MATH_FUNCTIONS = {
    'Math.Abs': Math.abs,
    'Math.Max': Math.max,
    'Math.Min': Math.min
  };
  const LOOP_LIMIT = 2048;

  function stripComments(code){
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
  }

  function tokenize(code){
    const tokens = [];
    const cleaned = code;
    const patterns = {
      whitespace: /\s+/,
      number: /^(?:\d+\.\d+|\d+\.\d*|\d*\.\d+|\d+)/,
      identifier: /^[A-Za-z_][A-Za-z0-9_]*/
    };
    const operators = ['<=','>=','==','!=','&&','||','++','--'];
    const punctuators = new Set(['{','}','(',')',';',',']);
    const singleOperators = new Set(['+','-','*','/','%','<','>','=','!','&','|']);
    let i = 0;
    while (i < cleaned.length){
      const char = cleaned[i];
      if (/\s/.test(char)){ i++; continue; }
      let matched = false;
      for (const op of operators){
        if (cleaned.startsWith(op, i)){
          tokens.push({type:'operator', value:op});
          i += op.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      if (punctuators.has(char)){
        tokens.push({type: char, value: char});
        i++;
        continue;
      }
      if (char === '.'){
        tokens.push({type:'.', value:'.'});
        i++;
        continue;
      }
      if (singleOperators.has(char)){
        tokens.push({type:'operator', value:char});
        i++;
        continue;
      }
      const rest = cleaned.slice(i);
      const numberMatch = rest.match(patterns.number);
      if (numberMatch){
        tokens.push({type:'number', value:numberMatch[0]});
        i += numberMatch[0].length;
        continue;
      }
      const idMatch = rest.match(patterns.identifier);
      if (idMatch){
        const value = idMatch[0];
        if (['public','static','void','int','double','bool','true','false','if','else','while','for','return'].includes(value)){
          tokens.push({type:'keyword', value});
        } else {
          tokens.push({type:'identifier', value});
        }
        i += value.length;
        continue;
      }
      throw new Error('Ugyldigt token ved: ' + rest.slice(0, 12));
    }
    tokens.push({type:'eof', value:null});
    return tokens;
  }

  class Parser {
    constructor(tokens){
      this.tokens = tokens;
      this.pos = 0;
    }
    peek(){ return this.tokens[this.pos]; }
    consume(){ return this.tokens[this.pos++]; }
    expect(type, value){
      const token = this.peek();
      if (!token || token.type !== type || (value && token.value !== value)){
        throw new Error(`Forventede ${value || type} men fandt ${token ? token.value : 'slut'}`);
      }
      this.pos++;
      return token;
    }
    match(type, value){
      const token = this.peek();
      if (token && token.type === type && (!value || token.value === value)){
        this.pos++;
        return true;
      }
      return false;
    }
    parseProgram(){
      const statements = [];
      while (this.peek().type !== 'eof'){
        statements.push(this.parseStatement());
      }
      return {type:'block', body:statements};
    }
    parseStatement(){
      const token = this.peek();
      if (token.type === 'keyword'){
        switch(token.value){
          case 'int':
          case 'double':
          case 'bool':
            return this.parseVariableDeclaration();
          case 'if':
            return this.parseIf();
          case 'while':
            return this.parseWhile();
          case 'for':
            return this.parseFor();
          case 'return':
            this.consume();
            if (!this.match(';')){
              this.parseExpression();
              this.expect(';');
            }
            return {type:'return'};
          default:
            throw new Error('Ikke tilladt keyword: ' + token.value);
        }
      }
      if (token.type === '{'){
        return this.parseBlock();
      }
      const expr = this.parseExpression();
      this.expect(';');
      return {type:'expr', expression:expr};
    }
    parseBlock(){
      this.expect('{');
      const body = [];
      while (!this.match('}')){
        if (this.peek().type === 'eof') throw new Error('Manglende }');
        body.push(this.parseStatement());
      }
      return {type:'block', body};
    }
    parseVariableDeclaration(){
      const typeToken = this.consume();
      const id = this.expect('identifier');
      let init = null;
      if (this.match('operator','=')){
        init = this.parseExpression();
      }
      this.expect(';');
      return {type:'var', varType:typeToken.value, name:id.value, init};
    }
    parseIf(){
      this.consume();
      this.expect('(');
      const test = this.parseExpression();
      this.expect(')');
      const consequent = this.parseStatement();
      let alternate = null;
      if (this.match('keyword','else')){
        alternate = this.parseStatement();
      }
      return {type:'if', test, consequent, alternate};
    }
    parseWhile(){
      this.consume();
      this.expect('(');
      const test = this.parseExpression();
      this.expect(')');
      const body = this.parseStatement();
      return {type:'while', test, body};
    }
    parseFor(){
      this.consume();
      this.expect('(');
      let init = null;
      if (!this.match(';')){
        if (this.peek().type === 'keyword' && ['int','double','bool'].includes(this.peek().value)){
          init = this.parseVariableDeclaration();
        } else {
          init = this.parseExpression();
          this.expect(';');
        }
      }
      let test = null;
      if (!this.match(';')){
        test = this.parseExpression();
        this.expect(';');
      }
      let update = null;
      if (!this.match(')')){
        update = this.parseExpression();
        this.expect(')');
      }
      const body = this.parseStatement();
      return {type:'for', init, test, update, body};
    }
    parseExpression(){
      return this.parseAssignment();
    }
    parseAssignment(){
      const left = this.parseLogicalOr();
      if (this.match('operator','=')){
        if (left.type !== 'identifier'){
          throw new Error('Kun variabler kan tildeles.');
        }
        const right = this.parseAssignment();
        return {type:'assign', name:left.name, value:right};
      }
      return left;
    }
    parseLogicalOr(){
      let expr = this.parseLogicalAnd();
      while (this.match('operator','||')){
        expr = {type:'binary', operator:'||', left:expr, right:this.parseLogicalAnd()};
      }
      return expr;
    }
    parseLogicalAnd(){
      let expr = this.parseEquality();
      while (this.match('operator','&&')){
        expr = {type:'binary', operator:'&&', left:expr, right:this.parseEquality()};
      }
      return expr;
    }
    parseEquality(){
      let expr = this.parseComparison();
      while (true){
        if (this.match('operator','==')){
          expr = {type:'binary', operator:'==', left:expr, right:this.parseComparison()};
        } else if (this.match('operator','!=')){
          expr = {type:'binary', operator:'!=', left:expr, right:this.parseComparison()};
        } else {
          break;
        }
      }
      return expr;
    }
    parseComparison(){
      let expr = this.parseTerm();
      while (true){
        if (this.match('operator','<')){
          expr = {type:'binary', operator:'<', left:expr, right:this.parseTerm()};
        } else if (this.match('operator','>')){
          expr = {type:'binary', operator:'>', left:expr, right:this.parseTerm()};
        } else if (this.match('operator','<=')){
          expr = {type:'binary', operator:'<=', left:expr, right:this.parseTerm()};
        } else if (this.match('operator','>=')){
          expr = {type:'binary', operator:'>=', left:expr, right:this.parseTerm()};
        } else {
          break;
        }
      }
      return expr;
    }
    parseTerm(){
      let expr = this.parseFactor();
      while (true){
        if (this.match('operator','+')){
          expr = {type:'binary', operator:'+', left:expr, right:this.parseFactor()};
        } else if (this.match('operator','-')){
          expr = {type:'binary', operator:'-', left:expr, right:this.parseFactor()};
        } else {
          break;
        }
      }
      return expr;
    }
    parseFactor(){
      let expr = this.parseUnary();
      while (true){
        if (this.match('operator','*')){
          expr = {type:'binary', operator:'*', left:expr, right:this.parseUnary()};
        } else if (this.match('operator','/')){
          expr = {type:'binary', operator:'/', left:expr, right:this.parseUnary()};
        } else if (this.match('operator','%')){
          expr = {type:'binary', operator:'%', left:expr, right:this.parseUnary()};
        } else {
          break;
        }
      }
      return expr;
    }
    parseUnary(){
      if (this.match('operator','!')){
        return {type:'unary', operator:'!', argument:this.parseUnary()};
      }
      if (this.match('operator','-')){
        return {type:'unary', operator:'neg', argument:this.parseUnary()};
      }
      return this.parsePrimary();
    }
    parsePrimary(){
      const token = this.consume();
      if (token.type === 'number'){
        return {type:'number', value: parseFloat(token.value)};
      }
      if (token.type === 'keyword' && (token.value === 'true' || token.value === 'false')){
        return {type:'boolean', value: token.value === 'true'};
      }
      if (token.type === '('){
        const expr = this.parseExpression();
        this.expect(')');
        return expr;
      }
      if (token.type === 'identifier'){
        let name = token.value;
        while (this.match('.')){
          const next = this.expect('identifier');
          name += '.' + next.value;
        }
        if (this.match('(')){
          const args = [];
          if (!this.match(')')){
            do {
              args.push(this.parseExpression());
            } while (this.match(','));
            this.expect(')');
          }
          if (!API_FUNCTIONS.includes(name) && !Object.prototype.hasOwnProperty.call(MATH_FUNCTIONS, name)){
            throw new Error('Ukendt funktionskald: ' + name);
          }
          return {type:'call', name, args};
        }
        return {type:'identifier', name};
      }
      throw new Error('Uventet token: ' + token.value);
    }
  }

  class Environment {
    constructor(parent){
      this.parent = parent || null;
      this.values = Object.create(null);
    }
    define(name, value){
      this.values[name] = value;
    }
    assign(name, value){
      if (Object.prototype.hasOwnProperty.call(this.values, name)){
        this.values[name] = value;
        return;
      }
      if (this.parent){
        this.parent.assign(name, value);
        return;
      }
      throw new Error('Ukendt variabel: ' + name);
    }
    get(name){
      if (Object.prototype.hasOwnProperty.call(this.values, name)){
        return this.values[name];
      }
      if (this.parent){
        return this.parent.get(name);
      }
      throw new Error('Ukendt variabel: ' + name);
    }
  }

  function evaluate(expr, env, ctx){
    switch(expr.type){
      case 'number': return expr.value;
      case 'boolean': return expr.value;
      case 'identifier': return env.get(expr.name);
      case 'assign': {
        const value = evaluate(expr.value, env, ctx);
        env.assign(expr.name, value);
        return value;
      }
      case 'unary': {
        const val = evaluate(expr.argument, env, ctx);
        if (expr.operator === '!') return !val;
        if (expr.operator === 'neg') return -val;
        throw new Error('Ukendt unær operator');
      }
      case 'binary': {
        const left = evaluate(expr.left, env, ctx);
        const right = evaluate(expr.right, env, ctx);
        switch(expr.operator){
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return right === 0 ? 0 : left / right;
          case '%': return left % right;
          case '<': return left < right;
          case '>': return left > right;
          case '<=': return left <= right;
          case '>=': return left >= right;
          case '==': return left === right;
          case '!=': return left !== right;
          case '&&': return Boolean(left) && Boolean(right);
          case '||': return Boolean(left) || Boolean(right);
          default: throw new Error('Ukendt operator ' + expr.operator);
        }
      }
      case 'call': {
        const fn = ctx.api[expr.name] || (ctx.math && ctx.math[expr.name]);
        if (!fn) throw new Error('Ikke tilladt API: ' + expr.name);
        const args = expr.args.map(arg => evaluate(arg, env, ctx));
        return fn.apply(null, args);
      }
      default:
        throw new Error('Uventet udtrykstype: ' + expr.type);
    }
  }

  function execute(node, env, ctx){
    switch(node.type){
      case 'block':
        executeBlock(node, env, ctx, false);
        return;
      case 'var': {
        const value = node.init ? evaluate(node.init, env, ctx) : defaultValue(node.varType);
        env.define(node.name, value);
        return;
      }
      case 'expr':
        evaluate(node.expression, env, ctx);
        return;
      case 'if': {
        if (truthy(evaluate(node.test, env, ctx))){
          execute(node.consequent, env, ctx);
        } else if (node.alternate){
          execute(node.alternate, env, ctx);
        }
        return;
      }
      case 'while': {
        let guard = LOOP_LIMIT;
        while (truthy(evaluate(node.test, env, ctx))){
          if (--guard < 0) throw new Error('While-løkke overskred grænse.');
          execute(node.body, env, ctx);
        }
        return;
      }
      case 'for': {
        const scope = new Environment(env);
        if (node.init){
          if (node.init.type === 'var'){
            execute(node.init, scope, ctx);
          } else {
            evaluate(node.init, scope, ctx);
          }
        }
        let guard = LOOP_LIMIT;
        while (true){
          if (node.test && !truthy(evaluate(node.test, scope, ctx))) break;
          execute(node.body, scope, ctx);
          if (--guard < 0) throw new Error('For-løkke overskred grænse.');
          if (node.update){ evaluate(node.update, scope, ctx); }
          if (!node.test) break;
        }
        return;
      }
      case 'return':
        return;
      default:
        throw new Error('Ukendt statement: ' + node.type);
    }
  }

  function executeBlock(node, env, ctx, keepScope){
    const scope = keepScope ? env : new Environment(env);
    for (const stmt of node.body){
      execute(stmt, scope, ctx);
    }
  }

  function defaultValue(type){
    switch(type){
      case 'int':
      case 'double': return 0;
      case 'bool': return false;
      default: return null;
    }
  }

  function truthy(value){
    return Boolean(value);
  }

  function parseStudentCode(code){
    const cleaned = stripComments(code);
    const {code: withoutGlobals, globals} = extractGlobalConstants(cleaned);
    const setupSection = extractFunctionBody(withoutGlobals, /public\s+static\s+void\s+Setup\s*\(\s*\)\s*\{/i);
    const tickSection = extractFunctionBody(withoutGlobals, /public\s+static\s+void\s+Tick\s*\(\s*int\s+\w+\s*\)\s*\{/i);
    if (!setupSection) throw new Error('Kunne ikke finde Setup().');
    if (!tickSection) throw new Error('Kunne ikke finde Tick(int dt).');

    const globalInject = globals.map(g => `${g.varType} ${g.name} = ${g.value};`).join('\n');
    const setupTokens = tokenize(globalInject + (globalInject ? '\n' : '') + setupSection.body);
    const tickTokens = tokenize(globalInject + (globalInject ? '\n' : '') + tickSection.body);
    const setupAst = new Parser(setupTokens).parseProgram();
    const tickAst = new Parser(tickTokens).parseProgram();

    return {setup: setupAst, tick: tickAst, globals};
  }

  function extractGlobalConstants(code){
    const globals = [];
    const pattern = /(const|static\s+readonly)\s+(int|double|bool)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^;]+);/gi;
    const cleaned = code.replace(pattern, (_, __, type, name, value) => {
      const varType = String(type).toLowerCase();
      globals.push({varType, name, value: value.trim()});
      return '';
    });
    return {code: cleaned, globals};
  }

  function extractFunctionBody(code, signatureRegex){
    const match = signatureRegex.exec(code);
    if (!match) return null;
    let index = match.index + match[0].length;
    const bodyStart = index;
    let depth = 1;
    while (index < code.length){
      const char = code[index];
      if (char === '{'){
        depth++;
      } else if (char === '}'){
        depth--;
        if (depth === 0){
          return {body: code.slice(bodyStart, index)};
        }
      }
      index++;
    }
    throw new Error('Manglede afsluttende } for funktion.');
  }

  function simulate(parsed, task){
    const dt = 16;
    const maxTime = task?.maxDurationMs || 12000;
    const timeline = [];
    const commandLog = [];
    const state = {
      angle: 0,
      height: 0,
      rotationSpeed: 15,
      liftSpeed: 0.3,
      targetAngle: 0,
      targetHeight: 0,
      safety: 'green',
      redDuration: 0,
      time: 0
    };

    const api = createApi(state, commandLog);
    const globalEnv = new Environment();
    globalEnv.define('dt', dt);
    const ctxBase = {api, math: MATH_FUNCTIONS};
    try {
      executeBlock(parsed.setup, globalEnv, ctxBase, true);
    } catch (err){
      throw new Error('Setup-fejl: ' + err.message);
    }

    for (let t = 0; t <= maxTime; t += dt){
      state.time = t;
      const tickEnv = new Environment(globalEnv);
      tickEnv.define('dt', dt);
      try {
        execute(parsed.tick, tickEnv, ctxBase);
      } catch (err){
        throw new Error('Tick-fejl ved ' + t + ' ms: ' + err.message);
      }
      stepSimulation(state, dt);
      timeline.push({t, angle: state.angle, height: state.height, safe: state.safety});
      if (state.redDuration > 200){
        // fortsæt men marker
      }
    }

    return {timeline, commandLog, message:'OK'};
  }

  function createApi(state, log){
    return {
      SetSpeed(value){
        const speed = clampNumber(value, -720, 720);
        const absSpeed = Math.abs(speed);
        state.rotationSpeed = absSpeed;
        state.liftSpeed = absSpeed > 0 ? Math.max(0.05, absSpeed / 40) : state.liftSpeed;
        log.push({time: state.time, op:'SetSpeed', value: state.rotationSpeed});
      },
      Rotate(value){
        const target = state.angle + value;
        state.targetAngle = normalizeAngle(target);
        log.push({time: state.time, op:'Rotate', value});
      },
      RotateTo(value){
        state.targetAngle = normalizeAngle(value);
        log.push({time: state.time, op:'RotateTo', value});
      },
      Lift(value){
        state.targetHeight = clampNumber(state.height + value, 0, 10);
        log.push({time: state.time, op:'Lift', value});
      },
      LiftTo(value){
        state.targetHeight = clampNumber(value, 0, 10);
        log.push({time: state.time, op:'LiftTo', value});
      },
      GetAngle(){
        return state.angle;
      },
      GetHeight(){
        return state.height;
      },
      IsSafe(){
        return state.safety !== 'red';
      }
    };
  }

  function stepSimulation(state, dt){
    const dtSec = dt / 1000;
    const targetAngle = state.targetAngle;
    const angleDiff = shortestAngleDiff(state.angle, targetAngle);
    const maxStep = state.rotationSpeed * dtSec;
    const angleStep = clampNumber(angleDiff, -maxStep, maxStep);
    state.angle = normalizeAngle(state.angle + angleStep);

    const heightDiff = state.targetHeight - state.height;
    const liftStep = clampNumber(heightDiff, -state.liftSpeed * dtSec, state.liftSpeed * dtSec);
    state.height = clampNumber(state.height + liftStep, 0, 10);

    const rotationRate = Math.abs(angleStep) / dtSec;
    const liftRate = Math.abs(liftStep) / dtSec;
    let safety = 'green';
    if (rotationRate > 35 || liftRate > 0.9) safety = 'yellow';
    if (rotationRate > 55 || liftRate > 1.2) safety = 'red';

    if (safety === 'red'){
      state.redDuration += dt;
    } else {
      state.redDuration = Math.max(0, state.redDuration - dt);
    }
    state.safety = safety;
  }

  function normalizeAngle(angle){
    let a = angle % 360;
    if (a < 0) a += 360;
    return a;
  }

  function shortestAngleDiff(from, to){
    let diff = normalizeAngle(to) - normalizeAngle(from);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }

  function clampNumber(value, min, max){
    if (typeof value !== 'number' || Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  window.Sim = {
    parseStudentCode,
    simulate
  };
})();
