import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface CapturedResponse {
  statusCode?: number;
  body?: unknown;
}

/** Minimal ArgumentsHost stub that records what the filter writes. */
function makeHost(captured: CapturedResponse): ArgumentsHost {
  const res = {
    status(code: number) {
      captured.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      captured.body = payload;
      return this;
    },
  };
  return {
    switchToHttp: () => ({ getResponse: () => res }),
  } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('passes business HttpExceptions through untouched (4xx)', () => {
    const captured: CapturedResponse = {};
    filter.catch(
      new BadRequestException('bad input'),
      makeHost(captured),
    );
    assert.equal(captured.statusCode, HttpStatus.BAD_REQUEST);
    assert.deepEqual(captured.body, {
      statusCode: 400,
      message: 'bad input',
      error: 'Bad Request',
    });
  });

  it('maps a database-unreachable error to 503', () => {
    const captured: CapturedResponse = {};
    const infra = new Prisma.PrismaClientInitializationError(
      'Cannot reach database server',
      '6.19.3',
    );
    filter.catch(infra, makeHost(captured));
    assert.equal(captured.statusCode, HttpStatus.SERVICE_UNAVAILABLE);
    assert.deepEqual(captured.body, {
      statusCode: 503,
      message: 'Service temporarily unavailable',
    });
  });

  it('maps a refused TCP connection (ECONNREFUSED) to 503', () => {
    const captured: CapturedResponse = {};
    filter.catch(
      Object.assign(new Error('connect ECONNREFUSED'), {
        code: 'ECONNREFUSED',
      }),
      makeHost(captured),
    );
    assert.equal(captured.statusCode, HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('falls back to a clean 500 for an unexpected error', () => {
    const captured: CapturedResponse = {};
    filter.catch(new Error('boom'), makeHost(captured));
    assert.equal(captured.statusCode, HttpStatus.INTERNAL_SERVER_ERROR);
    assert.deepEqual(captured.body, {
      statusCode: 500,
      message: 'Internal server error',
    });
  });
});
